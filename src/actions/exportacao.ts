"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/financeiro/constants";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/lib/agenda/constants";

export type ExportData = { headers: string[]; rows: (string | number)[][] };

export async function exportPatients(): Promise<ExportData> {
  const member = await requirePermission("patients_edit");
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("name, phone, email, cpf, birth_date, gender, address, origin, notes")
    .eq("clinic_id", member.clinicId)
    .order("name", { ascending: true });

  return {
    headers: ["Nome", "Telefone", "Email", "CPF", "Nascimento", "Gênero", "Endereço", "Origem", "Observações"],
    rows: (data ?? []).map((p) => [
      p.name,
      p.phone ?? "",
      p.email ?? "",
      p.cpf ?? "",
      p.birth_date ?? "",
      p.gender ?? "",
      p.address ?? "",
      p.origin ?? "",
      p.notes ?? "",
    ]),
  };
}

export async function exportProcedures(): Promise<ExportData> {
  const member = await requirePermission("budgets_edit");
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select("name, price, duration_minutes")
    .eq("clinic_id", member.clinicId)
    .order("name", { ascending: true });

  return {
    headers: ["Nome", "Preço", "Duração (min)"],
    rows: (data ?? []).map((p) => [p.name, p.price ?? "", p.duration_minutes ?? ""]),
  };
}

export async function exportAppointments(): Promise<ExportData> {
  const member = await requirePermission("agenda_edit");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "appointment_date, start_time, end_time, status, notes, patients(name), procedures(name)",
    )
    .eq("clinic_id", member.clinicId)
    .order("appointment_date", { ascending: false });

  return {
    headers: ["Data", "Início", "Fim", "Paciente", "Procedimento", "Status", "Observações"],
    rows: (data ?? []).map((a) => {
      const patient = a.patients as unknown as { name: string } | null;
      const procedure = a.procedures as unknown as { name: string } | null;
      return [
        a.appointment_date,
        a.start_time.slice(0, 5),
        a.end_time.slice(0, 5),
        patient?.name ?? "",
        procedure?.name ?? "",
        APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus] ?? a.status,
        a.notes ?? "",
      ];
    }),
  };
}

export async function exportFinancialEntries(): Promise<ExportData> {
  const member = await requirePermission("finance_edit");
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_entries")
    .select("description, type, amount, due_date, payment_date, status, payment_method, patients(name)")
    .eq("clinic_id", member.clinicId)
    .order("due_date", { ascending: false });

  return {
    headers: ["Descrição", "Tipo", "Valor", "Vencimento", "Pagamento", "Status", "Forma de pagamento", "Paciente"],
    rows: (data ?? []).map((e) => {
      const patient = e.patients as unknown as { name: string } | null;
      return [
        e.description,
        e.type === "revenue" ? "Receita" : "Despesa",
        e.amount,
        e.due_date ?? "",
        e.payment_date ?? "",
        e.status,
        e.payment_method ? PAYMENT_METHOD_LABELS[e.payment_method as PaymentMethod] : "",
        patient?.name ?? "",
      ];
    }),
  };
}
