"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { indexColumns, parseCsv } from "@/lib/importacao/csv";
import { readXlsx } from "@/lib/spreadsheet/xlsx";
import {
  normalizeAmountInput,
  normalizeCpfInput,
  normalizeDateInput,
  normalizePhoneInput,
  normalizeTimeInput,
} from "@/lib/spreadsheet/normalize";
import type { ImportResult, ImportRowError } from "@/lib/importacao/types";

const MISSING_FILE = "Envie uma planilha preenchida (.xlsx do Excel ou .csv).";

/** Só os dígitos, para comparar documentos e telefones gravados com
 *  máscaras diferentes ao longo do tempo. */
function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function getCell(row: string[], columns: Record<string, number>, key: string): string {
  const idx = columns[key];
  if (idx == null) return "";
  return (row[idx] ?? "").trim();
}

/**
 * Aceita Excel (.xlsx) e CSV — a clínica não precisa saber a diferença.
 * O formato é decidido pelo conteúdo, não pela extensão: um .xlsx é um
 * zip, então começa sempre com "PK". Arquivo renomeado errado continua
 * funcionando.
 */
async function readRows(file: File | null): Promise<{ header: string[]; data: string[][] } | null> {
  if (!file || file.size === 0) return null;

  const buffer = await file.arrayBuffer();
  const signature = new Uint8Array(buffer.slice(0, 2));
  const isZip = signature[0] === 0x50 && signature[1] === 0x4b;

  const rows = isZip
    ? await readXlsx(buffer)
    : parseCsv(new TextDecoder("utf-8").decode(buffer));

  if (rows.length === 0) return null;
  return { header: rows[0], data: rows.slice(1) };
}

export async function importPatients(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const member = await requirePermission("patients_edit");
  const parsed = await readRows(formData.get("file") as File | null);
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: MISSING_FILE }] };

  const columns = indexColumns(parsed.header);
  if (columns["nome"] == null) {
    return { total: 0, imported: 0, errors: [{ row: 1, reason: "Coluna \"nome\" não encontrada no arquivo." }] };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("patients").select("name, phone, cpf").eq("clinic_id", member.clinicId);

  const errors: ImportRowError[] = [];
  const toInsert: Record<string, string | null>[] = [];
  const seenCpfs = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = getCell(row, columns, "nome");
    if (!name) {
      errors.push({ row: rowNumber, reason: "Nome é obrigatório." });
      return;
    }

    // Telefone e CPF entram no padrão do sistema qualquer que seja o
    // formato da planilha, inclusive quando o Excel os gravou como
    // número e comeu o zero à esquerda.
    const cpf = normalizeCpfInput(getCell(row, columns, "cpf"));
    const phone = normalizePhoneInput(getCell(row, columns, "telefone"));

    const birthRaw = getCell(row, columns, "data_nascimento");
    const birthDate = birthRaw ? normalizeDateInput(birthRaw) : null;
    if (birthRaw && !birthDate) {
      errors.push({
        row: rowNumber,
        reason: `Data de nascimento inválida ("${birthRaw}"). Use dd/mm/aaaa ou aaaa-mm-dd.`,
      });
      return;
    }

    // Compara por dígitos: cadastros antigos podem estar sem máscara.
    const cpfDigits = digitsOnly(cpf);
    const phoneDigits = digitsOnly(phone);

    const isDuplicate =
      (cpfDigits && (existing?.some((p) => digitsOnly(p.cpf) === cpfDigits) || seenCpfs.has(cpfDigits))) ||
      existing?.some(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          phoneDigits !== "" &&
          digitsOnly(p.phone) === phoneDigits,
      );
    if (isDuplicate) {
      errors.push({ row: rowNumber, reason: "Paciente já cadastrado (duplicado)." });
      return;
    }
    if (cpfDigits) seenCpfs.add(cpfDigits);

    toInsert.push({
      clinic_id: member.clinicId,
      name,
      phone,
      email: getCell(row, columns, "email") || null,
      cpf,
      birth_date: birthDate,
      gender: getCell(row, columns, "genero") || null,
      address: getCell(row, columns, "endereco") || null,
      notes: getCell(row, columns, "observacoes") || null,
    });
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("patients").insert(toInsert);
    if (error) {
      return { total: parsed.data.length, imported: 0, errors: [{ row: 0, reason: "Erro ao salvar no banco de dados." }] };
    }
  }

  return { total: parsed.data.length, imported: toInsert.length, errors };
}

export async function importProcedures(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const member = await requirePermission("budgets_edit");
  const parsed = await readRows(formData.get("file") as File | null);
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: MISSING_FILE }] };

  const columns = indexColumns(parsed.header);
  if (columns["nome"] == null) {
    return { total: 0, imported: 0, errors: [{ row: 1, reason: "Coluna \"nome\" não encontrada no arquivo." }] };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("procedures").select("name").eq("clinic_id", member.clinicId);

  const errors: ImportRowError[] = [];
  const toInsert: Record<string, string | number | null>[] = [];
  const seenNames = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = getCell(row, columns, "nome");
    if (!name) {
      errors.push({ row: rowNumber, reason: "Nome é obrigatório." });
      return;
    }
    const key = name.toLowerCase();
    if (existing?.some((p) => p.name.toLowerCase() === key) || seenNames.has(key)) {
      errors.push({ row: rowNumber, reason: "Procedimento já cadastrado (duplicado)." });
      return;
    }
    seenNames.add(key);

    const priceRaw = getCell(row, columns, "preco");
    const price = priceRaw ? normalizeAmountInput(priceRaw) : null;
    if (priceRaw && price == null) {
      errors.push({ row: rowNumber, reason: `Preço inválido ("${priceRaw}").` });
      return;
    }

    toInsert.push({ clinic_id: member.clinicId, name, price });
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("procedures").insert(toInsert);
    if (error) {
      return { total: parsed.data.length, imported: 0, errors: [{ row: 0, reason: "Erro ao salvar no banco de dados." }] };
    }
  }

  return { total: parsed.data.length, imported: toInsert.length, errors };
}

export async function importAppointments(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const member = await requirePermission("agenda_edit");
  const parsed = await readRows(formData.get("file") as File | null);
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: MISSING_FILE }] };

  const columns = indexColumns(parsed.header);
  for (const required of ["paciente_nome", "data", "hora_inicio", "hora_fim"]) {
    if (columns[required] == null) {
      return { total: 0, imported: 0, errors: [{ row: 1, reason: `Coluna "${required}" não encontrada no arquivo.` }] };
    }
  }

  const supabase = await createClient();
  const [{ data: patients }, { data: professionals }, { data: procedures }, { data: existingAppointments }] =
    await Promise.all([
      supabase.from("patients").select("id, name, cpf").eq("clinic_id", member.clinicId),
      supabase.from("clinic_members").select("user_id, full_name").eq("clinic_id", member.clinicId),
      supabase.from("procedures").select("id, name").eq("clinic_id", member.clinicId),
      supabase.from("appointments").select("patient_id, appointment_date, start_time").eq("clinic_id", member.clinicId),
    ]);

  const errors: ImportRowError[] = [];
  const toInsert: Record<string, string | null>[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const patientName = getCell(row, columns, "paciente_nome");
    const patientCpf = digitsOnly(getCell(row, columns, "paciente_cpf"));
    const patient = patientCpf
      ? patients?.find((p) => digitsOnly(p.cpf) === patientCpf)
      : patients?.find((p) => p.name.toLowerCase() === patientName.toLowerCase());

    if (!patient) {
      errors.push({ row: rowNumber, reason: "Paciente não encontrado. Importe os pacientes primeiro." });
      return;
    }

    const dateRaw = getCell(row, columns, "data");
    const date = normalizeDateInput(dateRaw);
    const startTime = normalizeTimeInput(getCell(row, columns, "hora_inicio"));
    const endTime = normalizeTimeInput(getCell(row, columns, "hora_fim"));
    if (!date) {
      errors.push({ row: rowNumber, reason: `Data inválida ("${dateRaw}"). Use dd/mm/aaaa ou aaaa-mm-dd.` });
      return;
    }
    if (!startTime || !endTime) {
      errors.push({ row: rowNumber, reason: "Horário inválido. Use HH:MM (ex.: 14:00)." });
      return;
    }
    if (endTime <= startTime) {
      errors.push({ row: rowNumber, reason: "Horário final deve ser depois do inicial." });
      return;
    }

    const alreadyExists = existingAppointments?.some(
      (a) => a.patient_id === patient.id && a.appointment_date === date && a.start_time.slice(0, 5) === startTime,
    );
    if (alreadyExists) {
      errors.push({ row: rowNumber, reason: "Agendamento já existe para este paciente, data e horário." });
      return;
    }

    const professionalName = getCell(row, columns, "profissional_nome");
    const professional = professionalName
      ? professionals?.find((p) => p.full_name.toLowerCase() === professionalName.toLowerCase())
      : null;

    const procedureName = getCell(row, columns, "procedimento_nome");
    const procedure = procedureName
      ? procedures?.find((p) => p.name.toLowerCase() === procedureName.toLowerCase())
      : null;

    toInsert.push({
      clinic_id: member.clinicId,
      patient_id: patient.id,
      professional_id: professional?.user_id ?? null,
      procedure_id: procedure?.id ?? null,
      appointment_date: date,
      start_time: startTime,
      end_time: endTime,
      status: "scheduled",
      notes: getCell(row, columns, "observacoes") || null,
    });
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("appointments").insert(toInsert);
    if (error) {
      return { total: parsed.data.length, imported: 0, errors: [{ row: 0, reason: "Erro ao salvar no banco de dados." }] };
    }
  }

  return { total: parsed.data.length, imported: toInsert.length, errors };
}

const FINANCIAL_TYPE_MAP: Record<string, "revenue" | "expense"> = {
  receita: "revenue",
  despesa: "expense",
};

const FINANCIAL_STATUS_MAP: Record<string, "pending" | "paid" | "overdue" | "canceled"> = {
  pendente: "pending",
  pago: "paid",
  vencido: "overdue",
  cancelado: "canceled",
};

export async function importFinancialEntries(
  _prevState: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const member = await requirePermission("finance_edit");
  const parsed = await readRows(formData.get("file") as File | null);
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: MISSING_FILE }] };

  const columns = indexColumns(parsed.header);
  for (const required of ["descricao", "tipo", "valor"]) {
    if (columns[required] == null) {
      return { total: 0, imported: 0, errors: [{ row: 1, reason: `Coluna "${required}" não encontrada no arquivo.` }] };
    }
  }

  const supabase = await createClient();
  const [{ data: patients }, { data: existingEntries }] = await Promise.all([
    supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId),
    supabase.from("financial_entries").select("description, amount, due_date").eq("clinic_id", member.clinicId),
  ]);

  const errors: ImportRowError[] = [];
  const toInsert: Record<string, string | number | null>[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const description = getCell(row, columns, "descricao");
    const typeRaw = getCell(row, columns, "tipo").toLowerCase();
    const amountRaw = getCell(row, columns, "valor");

    if (!description) {
      errors.push({ row: rowNumber, reason: "Descrição é obrigatória." });
      return;
    }
    const type = FINANCIAL_TYPE_MAP[typeRaw];
    if (!type) {
      errors.push({ row: rowNumber, reason: 'Tipo inválido (use "receita" ou "despesa").' });
      return;
    }
    const amount = normalizeAmountInput(amountRaw);
    if (amount == null || amount <= 0) {
      errors.push({ row: rowNumber, reason: `Valor inválido ("${amountRaw}").` });
      return;
    }

    const dueRaw = getCell(row, columns, "vencimento");
    const dueDate = dueRaw ? normalizeDateInput(dueRaw) : null;
    if (dueRaw && !dueDate) {
      errors.push({
        row: rowNumber,
        reason: `Vencimento inválido ("${dueRaw}"). Use dd/mm/aaaa ou aaaa-mm-dd.`,
      });
      return;
    }

    const alreadyExists = existingEntries?.some(
      (e) => e.description === description && Number(e.amount) === amount && e.due_date === dueDate,
    );
    if (alreadyExists) {
      errors.push({ row: rowNumber, reason: "Lançamento já existe (mesma descrição, valor e vencimento)." });
      return;
    }

    const patientName = getCell(row, columns, "paciente_nome");
    const patient = patientName ? patients?.find((p) => p.name.toLowerCase() === patientName.toLowerCase()) : null;

    const statusRaw = getCell(row, columns, "status").toLowerCase();
    const status = FINANCIAL_STATUS_MAP[statusRaw] ?? "pending";

    toInsert.push({
      clinic_id: member.clinicId,
      description,
      type,
      amount,
      due_date: dueDate,
      patient_id: patient?.id ?? null,
      status,
    });
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("financial_entries").insert(toInsert);
    if (error) {
      return { total: parsed.data.length, imported: 0, errors: [{ row: 0, reason: "Erro ao salvar no banco de dados." }] };
    }
  }

  return { total: parsed.data.length, imported: toInsert.length, errors };
}
