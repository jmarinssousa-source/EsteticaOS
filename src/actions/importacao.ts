"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { indexColumns, parseCsv } from "@/lib/importacao/csv";
import type { ImportResult, ImportRowError } from "@/lib/importacao/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function getCell(row: string[], columns: Record<string, number>, key: string): string {
  const idx = columns[key];
  if (idx == null) return "";
  return (row[idx] ?? "").trim();
}

async function readRows(file: File | null): Promise<{ header: string[]; data: string[][] } | null> {
  if (!file || file.size === 0) return null;
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return null;
  return { header: rows[0], data: rows.slice(1) };
}

export async function importPatients(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const member = await requirePermission("patients_edit");
  const parsed = await readRows(formData.get("file") as File | null);
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: "Envie um arquivo CSV com dados." }] };

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

    const cpf = getCell(row, columns, "cpf") || null;
    const phone = getCell(row, columns, "telefone") || null;
    const birthDate = getCell(row, columns, "data_nascimento") || null;
    if (birthDate && !DATE_RE.test(birthDate)) {
      errors.push({ row: rowNumber, reason: "Data de nascimento inválida (use AAAA-MM-DD)." });
      return;
    }

    const isDuplicate =
      (cpf && (existing?.some((p) => p.cpf === cpf) || seenCpfs.has(cpf))) ||
      existing?.some((p) => p.name.toLowerCase() === name.toLowerCase() && phone && p.phone === phone);
    if (isDuplicate) {
      errors.push({ row: rowNumber, reason: "Paciente já cadastrado (duplicado)." });
      return;
    }
    if (cpf) seenCpfs.add(cpf);

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
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: "Envie um arquivo CSV com dados." }] };

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
    const price = priceRaw ? Number(priceRaw.replace(",", ".")) : null;
    if (priceRaw && Number.isNaN(price)) {
      errors.push({ row: rowNumber, reason: "Preço inválido." });
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
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: "Envie um arquivo CSV com dados." }] };

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
    const patientCpf = getCell(row, columns, "paciente_cpf");
    const patient = patientCpf
      ? patients?.find((p) => p.cpf === patientCpf)
      : patients?.find((p) => p.name.toLowerCase() === patientName.toLowerCase());

    if (!patient) {
      errors.push({ row: rowNumber, reason: "Paciente não encontrado. Importe os pacientes primeiro." });
      return;
    }

    const date = getCell(row, columns, "data");
    const startTime = getCell(row, columns, "hora_inicio");
    const endTime = getCell(row, columns, "hora_fim");
    if (!DATE_RE.test(date)) {
      errors.push({ row: rowNumber, reason: "Data inválida (use AAAA-MM-DD)." });
      return;
    }
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      errors.push({ row: rowNumber, reason: "Horário inválido (use HH:MM)." });
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
  if (!parsed) return { total: 0, imported: 0, errors: [{ row: 0, reason: "Envie um arquivo CSV com dados." }] };

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
    const amount = Number(amountRaw.replace(",", "."));
    if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNumber, reason: "Valor inválido." });
      return;
    }

    const dueDate = getCell(row, columns, "vencimento") || null;
    if (dueDate && !DATE_RE.test(dueDate)) {
      errors.push({ row: rowNumber, reason: "Vencimento inválido (use AAAA-MM-DD)." });
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
