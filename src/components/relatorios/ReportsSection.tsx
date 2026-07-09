import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/permissions";
import type { CurrentMember } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { LEAD_ORIGIN_LABELS, LEAD_ORIGINS } from "@/lib/crm/constants";
import { BUDGET_STATUS_LABELS, BUDGET_STATUSES } from "@/lib/orcamentos/constants";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUSES } from "@/lib/agenda/constants";
import { SESSION_STATUS_LABELS, SESSION_STATUSES } from "@/lib/sessions/constants";
import { ENTRY_STATUS_LABELS, ENTRY_STATUSES, ENTRY_TYPE_LABELS } from "@/lib/financeiro/constants";
import { RESPONSE_STATUS_LABELS } from "@/lib/anamnesis/constants";
import { computeCommissionsByProfessional } from "@/lib/financeiro/queries";
import { ReportTable, type ReportColumn, type ReportRow } from "@/components/relatorios/ReportTable";

export type ReportKey =
  | "leads"
  | "crm_conversao"
  | "orcamentos"
  | "vendas"
  | "financeiro"
  | "comissoes"
  | "agenda"
  | "sessoes"
  | "pacientes"
  | "estoque"
  | "anamneses";

const REPORT_LABELS: Record<ReportKey, string> = {
  leads: "Leads",
  crm_conversao: "Conversão do CRM",
  orcamentos: "Orçamentos",
  vendas: "Vendas",
  financeiro: "Financeiro",
  comissoes: "Comissões",
  agenda: "Agenda",
  sessoes: "Sessões",
  pacientes: "Pacientes",
  estoque: "Estoque",
  anamneses: "Anamneses",
};

const REPORT_PERMISSIONS: Record<ReportKey, Parameters<typeof hasPermission>[1]> = {
  leads: "crm_view",
  crm_conversao: "crm_view",
  orcamentos: "budgets_view",
  vendas: "budgets_view",
  financeiro: "finance_view",
  comissoes: "finance_commissions_view",
  agenda: "agenda_view",
  sessoes: "sessions_view",
  pacientes: "patients_view",
  estoque: "inventory_view",
  anamneses: "patients_view",
};

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

export async function ReportsSection({
  member,
  report,
  from,
  to,
  status,
  origem,
  profissional,
  paciente,
}: {
  member: CurrentMember;
  report: ReportKey;
  from: string;
  to: string;
  status: string;
  origem: string;
  profissional: string;
  paciente: string;
}) {
  const availableReports = (Object.keys(REPORT_LABELS) as ReportKey[]).filter((key) =>
    hasPermission(member, REPORT_PERMISSIONS[key]),
  );

  if (!availableReports.includes(report)) {
    return <p className="text-sm text-muted-foreground">Você não tem permissão para ver este relatório.</p>;
  }

  const supabase = await createClient();

  const [{ data: professionals }, { data: patients }] = await Promise.all([
    supabase
      .from("clinic_members")
      .select("user_id, full_name")
      .eq("clinic_id", member.clinicId)
      .eq("status", "active")
      .order("full_name"),
    supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId).order("name"),
  ]);

  let columns: ReportColumn[] = [];
  let rows: ReportRow[] = [];
  let totalsLabel: string | undefined;

  if (report === "leads") {
    let query = supabase
      .from("leads")
      .select("name, phone, origin, status, assigned_to, potential_value, created_at, last_moved_at")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);
    if (origem) query = query.eq("origin", origem);
    if (profissional) query = query.eq("assigned_to", profissional);
    if (status) query = query.eq("status", status);
    const { data } = await query.order("created_at", { ascending: false });

    columns = [
      { key: "name", label: "Nome" },
      { key: "phone", label: "Telefone" },
      { key: "origin", label: "Origem" },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
      { key: "potential_value", label: "Valor potencial" },
      { key: "created_at", label: "Criado em" },
    ];
    rows = (data ?? []).map((l) => ({
      name: l.name,
      phone: l.phone ?? "—",
      origin: LEAD_ORIGIN_LABELS[l.origin as keyof typeof LEAD_ORIGIN_LABELS] ?? l.origin,
      status: l.status,
      responsavel: professionals?.find((p) => p.user_id === l.assigned_to)?.full_name ?? "—",
      potential_value: l.potential_value != null ? formatCurrency(l.potential_value) : "—",
      created_at: fmtDate(l.created_at),
    }));
  }

  if (report === "crm_conversao") {
    const { data } = await supabase
      .from("leads")
      .select("origin, status")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);

    const byOrigin = new Map<string, { total: number; converted: number; lost: number }>();
    for (const lead of data ?? []) {
      const entry = byOrigin.get(lead.origin) ?? { total: 0, converted: 0, lost: 0 };
      entry.total += 1;
      if (lead.status === "converted") entry.converted += 1;
      if (lead.status === "lost") entry.lost += 1;
      byOrigin.set(lead.origin, entry);
    }

    columns = [
      { key: "origin", label: "Origem" },
      { key: "total", label: "Total de leads" },
      { key: "converted", label: "Convertidos" },
      { key: "lost", label: "Perdidos" },
      { key: "rate", label: "Taxa de conversão" },
    ];
    rows = [...byOrigin.entries()].map(([origin, entry]) => ({
      origin: LEAD_ORIGIN_LABELS[origin as keyof typeof LEAD_ORIGIN_LABELS] ?? origin,
      total: entry.total,
      converted: entry.converted,
      lost: entry.lost,
      rate: entry.total > 0 ? `${((entry.converted / entry.total) * 100).toFixed(0)}%` : "—",
    }));
  }

  if (report === "orcamentos") {
    let query = supabase
      .from("budgets")
      .select("patient_id, status, total_value, discount, created_at")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);
    if (status) query = query.eq("status", status);
    if (paciente) query = query.eq("patient_id", paciente);
    const { data } = await query.order("created_at", { ascending: false });

    columns = [
      { key: "patient", label: "Paciente" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total" },
      { key: "discount", label: "Desconto" },
      { key: "created_at", label: "Criado em" },
    ];
    rows = (data ?? []).map((b) => ({
      patient: patients?.find((p) => p.id === b.patient_id)?.name ?? "—",
      status: BUDGET_STATUS_LABELS[b.status as keyof typeof BUDGET_STATUS_LABELS] ?? b.status,
      total: formatCurrency(Number(b.total_value)),
      discount: formatCurrency(Number(b.discount)),
      created_at: fmtDate(b.created_at),
    }));
    const total = (data ?? []).reduce((sum, b) => sum + Number(b.total_value), 0);
    totalsLabel = `Total: ${formatCurrency(total)} · ${(data ?? []).length} orçamento(s)`;
  }

  if (report === "vendas") {
    let query = supabase
      .from("sales")
      .select("patient_id, total_value, sale_date")
      .eq("clinic_id", member.clinicId)
      .gte("sale_date", from)
      .lte("sale_date", to);
    if (paciente) query = query.eq("patient_id", paciente);
    const { data } = await query.order("sale_date", { ascending: false });

    columns = [
      { key: "patient", label: "Paciente" },
      { key: "total", label: "Valor" },
      { key: "sale_date", label: "Data da venda" },
    ];
    rows = (data ?? []).map((s) => ({
      patient: patients?.find((p) => p.id === s.patient_id)?.name ?? "—",
      total: formatCurrency(Number(s.total_value)),
      sale_date: fmtDate(s.sale_date),
    }));
    const total = (data ?? []).reduce((sum, s) => sum + Number(s.total_value), 0);
    totalsLabel = `Total vendido: ${formatCurrency(total)} · ${(data ?? []).length} venda(s)`;
  }

  if (report === "financeiro") {
    let query = supabase
      .from("financial_entries")
      .select("description, patient_id, type, amount, due_date, payment_date, status")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);
    if (status) query = query.eq("status", status);
    const { data } = await query.order("created_at", { ascending: false });

    columns = [
      { key: "description", label: "Descrição" },
      { key: "patient", label: "Paciente" },
      { key: "type", label: "Tipo" },
      { key: "amount", label: "Valor" },
      { key: "due_date", label: "Vencimento" },
      { key: "status", label: "Status" },
    ];
    rows = (data ?? []).map((e) => ({
      description: e.description,
      patient: patients?.find((p) => p.id === e.patient_id)?.name ?? "—",
      type: ENTRY_TYPE_LABELS[e.type as keyof typeof ENTRY_TYPE_LABELS],
      amount: formatCurrency(Number(e.amount)),
      due_date: fmtDate(e.due_date),
      status: ENTRY_STATUS_LABELS[e.status as keyof typeof ENTRY_STATUS_LABELS],
    }));
    const revenueTotal = (data ?? []).filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.amount), 0);
    const expenseTotal = (data ?? []).filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    totalsLabel = `Receitas: ${formatCurrency(revenueTotal)} · Despesas: ${formatCurrency(expenseTotal)}`;
  }

  if (report === "comissoes") {
    const commissions = await computeCommissionsByProfessional(supabase, member.clinicId, from, to);
    columns = [
      { key: "professional", label: "Profissional" },
      { key: "amount", label: "Comissão" },
    ];
    rows = commissions.map((c) => ({
      professional: professionals?.find((p) => p.user_id === c.professionalId)?.full_name ?? "Profissional",
      amount: formatCurrency(c.amount),
    }));
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    totalsLabel = `Total: ${formatCurrency(total)}`;
  }

  if (report === "agenda") {
    let query = supabase
      .from("appointments")
      .select("patient_id, professional_id, procedure_id, appointment_date, start_time, end_time, status")
      .eq("clinic_id", member.clinicId)
      .gte("appointment_date", from)
      .lte("appointment_date", to);
    if (profissional) query = query.eq("professional_id", profissional);
    if (status) query = query.eq("status", status);
    const { data } = await query.order("appointment_date", { ascending: false });

    columns = [
      { key: "patient", label: "Paciente" },
      { key: "date", label: "Data" },
      { key: "time", label: "Horário" },
      { key: "professional", label: "Profissional" },
      { key: "status", label: "Status" },
    ];
    rows = (data ?? []).map((a) => ({
      patient: patients?.find((p) => p.id === a.patient_id)?.name ?? "—",
      date: fmtDate(a.appointment_date),
      time: `${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`,
      professional: professionals?.find((p) => p.user_id === a.professional_id)?.full_name ?? "—",
      status: APPOINTMENT_STATUS_LABELS[a.status as keyof typeof APPOINTMENT_STATUS_LABELS],
    }));
  }

  if (report === "sessoes") {
    let query = supabase
      .from("sessions")
      .select("patient_id, professional_id, session_date, status, patient_signature, professional_signature")
      .eq("clinic_id", member.clinicId)
      .gte("session_date", from)
      .lte("session_date", to);
    if (profissional) query = query.eq("professional_id", profissional);
    if (status) query = query.eq("status", status);
    const { data } = await query.order("session_date", { ascending: false });

    columns = [
      { key: "patient", label: "Paciente" },
      { key: "date", label: "Data" },
      { key: "professional", label: "Profissional" },
      { key: "status", label: "Status" },
      { key: "signatures", label: "Assinaturas" },
    ];
    rows = (data ?? []).map((s) => ({
      patient: patients?.find((p) => p.id === s.patient_id)?.name ?? "—",
      date: fmtDate(s.session_date),
      professional: professionals?.find((p) => p.user_id === s.professional_id)?.full_name ?? "—",
      status: SESSION_STATUS_LABELS[s.status as keyof typeof SESSION_STATUS_LABELS],
      signatures: s.patient_signature && s.professional_signature ? "Completa" : "Pendente",
    }));
  }

  if (report === "pacientes") {
    let query = supabase
      .from("patients")
      .select("name, phone, email, cpf, origin, created_at")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);
    if (origem) query = query.eq("origin", origem);
    const { data } = await query.order("created_at", { ascending: false });

    columns = [
      { key: "name", label: "Nome" },
      { key: "phone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "cpf", label: "CPF" },
      { key: "origin", label: "Origem" },
      { key: "created_at", label: "Cadastrado em" },
    ];
    rows = (data ?? []).map((p) => ({
      name: p.name,
      phone: p.phone ?? "—",
      email: p.email ?? "—",
      cpf: p.cpf ?? "—",
      origin: p.origin ? (LEAD_ORIGIN_LABELS[p.origin as keyof typeof LEAD_ORIGIN_LABELS] ?? p.origin) : "—",
      created_at: fmtDate(p.created_at),
    }));
  }

  if (report === "estoque") {
    const { data } = await supabase
      .from("products")
      .select("name, category, quantity, unit, batch, expiration_date, min_stock, status")
      .eq("clinic_id", member.clinicId)
      .order("name");

    columns = [
      { key: "name", label: "Produto" },
      { key: "category", label: "Categoria" },
      { key: "quantity", label: "Quantidade" },
      { key: "batch", label: "Lote" },
      { key: "expiration_date", label: "Validade" },
      { key: "min_stock", label: "Estoque mínimo" },
    ];
    rows = (data ?? []).map((p) => ({
      name: p.name,
      category: p.category ?? "—",
      quantity: `${p.quantity} ${p.unit}`,
      batch: p.batch ?? "—",
      expiration_date: fmtDate(p.expiration_date),
      min_stock: p.min_stock,
    }));
  }

  if (report === "anamneses") {
    let query = supabase
      .from("anamnesis_responses")
      .select("patient_id, status, created_at, anamnesis_templates(name)")
      .eq("clinic_id", member.clinicId)
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`);
    if (status) query = query.eq("status", status);
    const { data } = await query.order("created_at", { ascending: false });

    columns = [
      { key: "patient", label: "Paciente" },
      { key: "template", label: "Modelo" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Enviada em" },
    ];
    rows = (data ?? []).map((r) => ({
      patient: patients?.find((p) => p.id === r.patient_id)?.name ?? "—",
      template: (r.anamnesis_templates as unknown as { name: string } | null)?.name ?? "—",
      status: RESPONSE_STATUS_LABELS[r.status as keyof typeof RESPONSE_STATUS_LABELS],
      created_at: fmtDate(r.created_at),
    }));
  }

  const statusOptions = getStatusOptions(report);
  const showOrigin = report === "leads" || report === "pacientes";
  const showProfessional = report === "leads" || report === "agenda" || report === "sessoes";
  const showPatient = report === "orcamentos" || report === "vendas";
  const showPeriod = report !== "estoque";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border p-0.5">
        {availableReports.map((key) => (
          <Link
            key={key}
            href={`/relatorios?tab=relatorios&report=${key}&from=${from}&to=${to}`}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              report === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {REPORT_LABELS[key]}
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
      >
        <input type="hidden" name="tab" value="relatorios" />
        <input type="hidden" name="report" value={report} />

        {showPeriod && (
          <>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">De</label>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
            </div>
          </>
        )}

        {statusOptions && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Todos</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showOrigin && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Origem</label>
            <select
              name="origem"
              defaultValue={origem}
              className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Todas</option>
              {LEAD_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {LEAD_ORIGIN_LABELS[o]}
                </option>
              ))}
            </select>
          </div>
        )}

        {showProfessional && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Profissional</label>
            <select
              name="profissional"
              defaultValue={profissional}
              className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Todos</option>
              {professionals?.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPatient && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Paciente</label>
            <select
              name="paciente"
              defaultValue={paciente}
              className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Todos</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Filtrar
        </button>
      </form>

      <ReportTable columns={columns} rows={rows} filename={report} totalsLabel={totalsLabel} />
    </div>
  );
}

function getStatusOptions(report: ReportKey): { value: string; label: string }[] | null {
  if (report === "leads") return [{ value: "open", label: "Aberto" }, { value: "converted", label: "Convertido" }, { value: "lost", label: "Perdido" }];
  if (report === "orcamentos") return BUDGET_STATUSES.map((s) => ({ value: s, label: BUDGET_STATUS_LABELS[s] }));
  if (report === "financeiro") return ENTRY_STATUSES.map((s) => ({ value: s, label: ENTRY_STATUS_LABELS[s] }));
  if (report === "agenda") return APPOINTMENT_STATUSES.map((s) => ({ value: s, label: APPOINTMENT_STATUS_LABELS[s] }));
  if (report === "sessoes") return SESSION_STATUSES.map((s) => ({ value: s, label: SESSION_STATUS_LABELS[s] }));
  if (report === "anamneses")
    return [
      { value: "pending", label: "Pendente" },
      { value: "completed", label: "Preenchida" },
      { value: "reviewed", label: "Revisada" },
    ];
  return null;
}
