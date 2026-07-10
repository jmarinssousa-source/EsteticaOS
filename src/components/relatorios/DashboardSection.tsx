import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Kanban,
  Percent,
  ReceiptText,
  TrendingUp,
  UserCheck,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/permissions";
import type { CurrentMember } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { computeCommissionsByProfessional } from "@/lib/financeiro/queries";
import { StatCard } from "@/components/dashboard/StatCard";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { RevenueByProfessionalChart } from "@/components/relatorios/RevenueByProfessionalChart";
import { RevenueShareChart } from "@/components/relatorios/RevenueShareChart";

export async function DashboardSection({
  member,
  from,
  to,
}: {
  member: CurrentMember;
  from: string;
  to: string;
}) {
  const canViewCrm = hasPermission(member, "crm_view");
  const canViewAgenda = hasPermission(member, "agenda_view");
  const canViewBudgets = hasPermission(member, "budgets_view");
  const canViewSessions = hasPermission(member, "sessions_view");
  const canViewRevenue = hasPermission(member, "finance_revenue_view");
  const canViewExpense = hasPermission(member, "finance_expense_view");
  const canViewCommissions = hasPermission(member, "finance_commissions_view");
  const canEditGoal = member.role === "owner";

  const supabase = await createClient();
  const yearMonth = from.slice(0, 7);

  const [
    { data: goal },
    { data: sales },
    { data: newLeads },
    { data: appointments },
    { data: budgetsInPeriod },
    { data: sessionsInPeriod },
    { data: receivable },
    { data: payable },
  ] = await Promise.all([
    supabase
      .from("monthly_goals")
      .select("goal_amount")
      .eq("clinic_id", member.clinicId)
      .eq("year_month", yearMonth)
      .maybeSingle(),
    supabase
      .from("sales")
      .select("total_value")
      .eq("clinic_id", member.clinicId)
      .gte("sale_date", from)
      .lte("sale_date", to),
    canViewCrm
      ? supabase
          .from("leads")
          .select("id")
          .eq("clinic_id", member.clinicId)
          .gte("created_at", from)
          .lte("created_at", `${to}T23:59:59`)
      : Promise.resolve({ data: null }),
    canViewAgenda
      ? supabase
          .from("appointments")
          .select("id, status")
          .eq("clinic_id", member.clinicId)
          .gte("appointment_date", from)
          .lte("appointment_date", to)
      : Promise.resolve({ data: null }),
    canViewBudgets
      ? supabase
          .from("budgets")
          .select("id, status")
          .eq("clinic_id", member.clinicId)
          .gte("created_at", from)
          .lte("created_at", `${to}T23:59:59`)
      : Promise.resolve({ data: null }),
    canViewSessions
      ? supabase
          .from("sessions")
          .select("id, status, patient_signature, professional_signature")
          .eq("clinic_id", member.clinicId)
          .gte("session_date", from)
          .lte("session_date", to)
      : Promise.resolve({ data: null }),
    canViewRevenue
      ? supabase
          .from("financial_entries")
          .select("amount")
          .eq("clinic_id", member.clinicId)
          .eq("type", "revenue")
          .in("status", ["pending", "overdue"])
      : Promise.resolve({ data: null }),
    canViewExpense
      ? supabase
          .from("financial_entries")
          .select("amount")
          .eq("clinic_id", member.clinicId)
          .eq("type", "expense")
          .in("status", ["pending", "overdue"])
      : Promise.resolve({ data: null }),
  ]);

  const soldInPeriod = (sales ?? []).reduce((sum, s) => sum + Number(s.total_value), 0);
  const salesCount = (sales ?? []).length;
  const averageTicket = salesCount > 0 ? soldInPeriod / salesCount : 0;

  const openBudgetsCount = (budgetsInPeriod ?? []).filter((b) => ["open", "sent"].includes(b.status)).length;
  const approvedBudgetsCount = (budgetsInPeriod ?? []).filter((b) => b.status === "approved").length;

  const doneSessions = (sessionsInPeriod ?? []).filter((s) => s.status === "done");
  const pendingSignatureCount = doneSessions.filter((s) => !s.patient_signature || !s.professional_signature).length;

  const nonCanceled = (appointments ?? []).filter((a) => !a.status.startsWith("canceled"));
  const attended = nonCanceled.filter((a) => ["confirmed", "attended", "done"].includes(a.status));
  const attendanceRate = nonCanceled.length > 0 ? (attended.length / nonCanceled.length) * 100 : 0;

  const receivableTotal = (receivable ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const payableTotal = (payable ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  let commissionTotal = 0;
  let revenueByProfessional: { professionalId: string; name: string; amount: number }[] = [];
  if (canViewCommissions) {
    const commissions = await computeCommissionsByProfessional(supabase, member.clinicId, from, to);
    commissionTotal = commissions.reduce((sum, c) => sum + c.amount, 0);
  }
  if (canViewBudgets) {
    const { data: revenueRows } = await supabase
      .from("sales")
      .select("id, budget_id, sale_date")
      .eq("clinic_id", member.clinicId)
      .gte("sale_date", from)
      .lte("sale_date", to);

    if (revenueRows && revenueRows.length > 0) {
      const { data: items } = await supabase
        .from("budget_items")
        .select("budget_id, professional_id, quantity, unit_price, discount")
        .in(
          "budget_id",
          revenueRows.map((r) => r.budget_id),
        )
        .not("professional_id", "is", null);

      const { data: members } = await supabase
        .from("clinic_members")
        .select("user_id, full_name")
        .eq("clinic_id", member.clinicId);

      const totals = new Map<string, number>();
      for (const item of items ?? []) {
        const subtotal = item.quantity * Number(item.unit_price) - Number(item.discount);
        const key = item.professional_id as string;
        totals.set(key, (totals.get(key) ?? 0) + subtotal);
      }
      revenueByProfessional = [...totals.entries()]
        .map(([professionalId, amount]) => ({
          professionalId,
          name: members?.find((m) => m.user_id === professionalId)?.full_name ?? "Profissional",
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GoalCard yearMonth={yearMonth} goalAmount={Number(goal?.goal_amount ?? 0)} soldAmount={soldInPeriod} canEdit={canEditGoal} />

        {canViewBudgets && (
          <>
            <StatCard title="Vendas no período" value={String(salesCount)} icon={TrendingUp} href="/orcamentos" />
            <StatCard title="Ticket médio" value={formatCurrency(averageTicket)} icon={CircleDollarSign} href="/orcamentos" />
            <StatCard title="Orçamentos em aberto" value={String(openBudgetsCount)} icon={ClipboardList} href="/orcamentos" />
            <StatCard title="Orçamentos aprovados" value={String(approvedBudgetsCount)} icon={ClipboardCheck} href="/orcamentos" />
          </>
        )}

        {canViewCrm && (
          <StatCard title="Leads novos no período" value={String((newLeads ?? []).length)} icon={Kanban} href="/crm" />
        )}

        {canViewAgenda && (
          <StatCard
            title="Taxa de comparecimento"
            value={`${attendanceRate.toFixed(0)}%`}
            subtitle={`${attended.length} de ${nonCanceled.length} agendamentos`}
            icon={CalendarDays}
            href="/agenda"
          />
        )}

        {canViewSessions && (
          <>
            <StatCard title="Sessões realizadas" value={String(doneSessions.length)} icon={Wrench} href="/sessoes" />
            <StatCard
              title="Sessões pendentes de assinatura"
              value={String(pendingSignatureCount)}
              icon={UserCheck}
              href="/sessoes"
              emphasis={pendingSignatureCount > 0}
            />
          </>
        )}

        {canViewRevenue && (
          <StatCard title="Contas a receber" value={formatCurrency(receivableTotal)} icon={CircleDollarSign} href="/financeiro?filter=receber" />
        )}
        {canViewExpense && (
          <StatCard title="Contas a pagar" value={formatCurrency(payableTotal)} icon={ReceiptText} href="/financeiro?filter=pagar" />
        )}
        {canViewCommissions && (
          <StatCard title="Comissão a pagar" value={formatCurrency(commissionTotal)} icon={Percent} href="/financeiro" />
        )}
      </div>

      {canViewBudgets && revenueByProfessional.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Receita por profissional</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RevenueByProfessionalChart data={revenueByProfessional} />
            </div>
            <div className="border-t pt-4 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Participação no faturamento</p>
              <RevenueShareChart data={revenueByProfessional} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
