import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Kanban,
  Package,
  PenLine,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { getCurrentMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/permissions";
import { currentYearMonth, daysFromNow, formatCurrency } from "@/lib/format";
import { EXPIRING_SOON_DAYS } from "@/lib/estoque/constants";
import { isExpired, isExpiringSoon, isLowStock } from "@/lib/estoque/types";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsPanel, type AlertItem } from "@/components/dashboard/AlertsPanel";

export const metadata = { title: "Hoje — EstéticaOS" };

function isStaleLead(lastMovedAt: string, staleLeadDays: number) {
  const daysSinceMoved = (Date.now() - new Date(lastMovedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceMoved >= staleLeadDays;
}

export default async function HojePage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const canViewAgenda = hasPermission(member, "agenda_view");
  const canViewCrm = hasPermission(member, "crm_view");
  const canViewBudgets = hasPermission(member, "budgets_view");
  const canViewSessions = hasPermission(member, "sessions_view");
  const canViewRevenue = hasPermission(member, "finance_revenue_view");
  const canViewExpense = hasPermission(member, "finance_expense_view");
  const canViewInventory = hasPermission(member, "inventory_view");
  const canEditGoal = member.role === "owner" || member.role === "manager";

  const yearMonth = currentYearMonth();
  const monthStart = `${yearMonth}-01`;
  const monthEnd = new Date(Number(yearMonth.slice(0, 4)), Number(yearMonth.slice(5, 7)), 0)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const soonDate = daysFromNow(EXPIRING_SOON_DAYS);

  const supabase = await createClient();

  const [
    { data: goal },
    { data: sales },
    { data: appointmentsToday },
    { data: leads },
    { data: clinic },
    { data: openBudgets },
    { data: sessionsToday },
    { data: unsignedSessions },
    { data: receivable },
    { data: payable },
    { data: products },
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
      .gte("sale_date", monthStart)
      .lte("sale_date", monthEnd),
    canViewAgenda
      ? supabase
          .from("appointments")
          .select("id")
          .eq("clinic_id", member.clinicId)
          .eq("appointment_date", today)
      : Promise.resolve({ data: null }),
    canViewCrm
      ? supabase
          .from("leads")
          .select("id, status, follow_up_date, last_moved_at")
          .eq("clinic_id", member.clinicId)
          .eq("status", "open")
      : Promise.resolve({ data: null }),
    canViewCrm
      ? supabase.from("clinics").select("stale_lead_days").eq("id", member.clinicId).single()
      : Promise.resolve({ data: null }),
    canViewBudgets
      ? supabase
          .from("budgets")
          .select("id")
          .eq("clinic_id", member.clinicId)
          .in("status", ["open", "sent"])
      : Promise.resolve({ data: null }),
    canViewSessions
      ? supabase
          .from("sessions")
          .select("id")
          .eq("clinic_id", member.clinicId)
          .eq("session_date", today)
      : Promise.resolve({ data: null }),
    canViewSessions
      ? supabase
          .from("sessions")
          .select("id, patient_signature, professional_signature")
          .eq("clinic_id", member.clinicId)
          .eq("status", "done")
      : Promise.resolve({ data: null }),
    canViewRevenue
      ? supabase
          .from("financial_entries")
          .select("amount, status")
          .eq("clinic_id", member.clinicId)
          .eq("type", "revenue")
          .in("status", ["pending", "overdue"])
      : Promise.resolve({ data: null }),
    canViewExpense
      ? supabase
          .from("financial_entries")
          .select("amount, status")
          .eq("clinic_id", member.clinicId)
          .eq("type", "expense")
          .in("status", ["pending", "overdue"])
      : Promise.resolve({ data: null }),
    canViewInventory
      ? supabase
          .from("products")
          .select("id, name, quantity, min_stock, expiration_date")
          .eq("clinic_id", member.clinicId)
          .eq("status", "active")
      : Promise.resolve({ data: null }),
  ]);

  const soldAmount = (sales ?? []).reduce((sum, s) => sum + Number(s.total_value), 0);

  const staleLeadDays = clinic?.stale_lead_days ?? 3;
  const openLeads = leads ?? [];
  const staleLeads = openLeads.filter((l) => isStaleLead(l.last_moved_at, staleLeadDays));
  const overdueFollowUps = openLeads.filter((l) => l.follow_up_date && l.follow_up_date < today);

  const pendingSignatureSessions = (unsignedSessions ?? []).filter(
    (s) => !s.patient_signature || !s.professional_signature,
  );

  const receivableTotal = (receivable ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const payableTotal = (payable ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const overdueReceivable = (receivable ?? []).filter((e) => e.status === "overdue");
  const overduePayable = (payable ?? []).filter((e) => e.status === "overdue");

  const productList = products ?? [];
  const lowStockProducts = productList.filter((p) => isLowStock(p));
  const expiredProducts = productList.filter((p) => isExpired(p.expiration_date, today));
  const expiringProducts = productList.filter((p) => isExpiringSoon(p.expiration_date, today, soonDate));

  const alerts: AlertItem[] = [
    ...(staleLeads.length > 0
      ? [{ label: `${staleLeads.length} lead(s) parado(s) no CRM`, href: "/crm" }]
      : []),
    ...(overdueFollowUps.length > 0
      ? [{ label: `${overdueFollowUps.length} follow-up(s) vencido(s)`, href: "/crm" }]
      : []),
    ...(pendingSignatureSessions.length > 0
      ? [{ label: `${pendingSignatureSessions.length} sessão(ões) pendente(s) de assinatura`, href: "/sessoes" }]
      : []),
    ...(overdueReceivable.length > 0
      ? [{ label: `${overdueReceivable.length} conta(s) a receber vencida(s)`, href: "/financeiro?filter=receber" }]
      : []),
    ...(overduePayable.length > 0
      ? [{ label: `${overduePayable.length} conta(s) a pagar vencida(s)`, href: "/financeiro?filter=pagar" }]
      : []),
    ...(lowStockProducts.length > 0
      ? [{ label: `${lowStockProducts.length} produto(s) com estoque baixo`, href: "/estoque" }]
      : []),
    ...(expiredProducts.length > 0
      ? [{ label: `${expiredProducts.length} produto(s) vencido(s)`, href: "/estoque" }]
      : []),
    ...(expiringProducts.length > 0
      ? [{ label: `${expiringProducts.length} produto(s) vencendo em breve`, href: "/estoque" }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {member.fullName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">{member.clinicName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GoalCard
          yearMonth={yearMonth}
          goalAmount={Number(goal?.goal_amount ?? 0)}
          soldAmount={soldAmount}
          canEdit={canEditGoal}
        />

        {canViewAgenda && (
          <StatCard
            title="Agenda do dia"
            value={String(appointmentsToday?.length ?? 0)}
            icon={CalendarDays}
            href="/agenda"
          />
        )}

        {canViewCrm && (
          <>
            <StatCard title="Leads pendentes" value={String(openLeads.length)} icon={Kanban} href="/crm" />
            <StatCard
              title="Leads parados"
              value={String(staleLeads.length)}
              icon={AlertTriangle}
              href="/crm"
              emphasis={staleLeads.length > 0}
            />
            <StatCard
              title="Follow-ups vencidos"
              value={String(overdueFollowUps.length)}
              icon={Clock}
              href="/crm"
              emphasis={overdueFollowUps.length > 0}
            />
          </>
        )}

        {canViewBudgets && (
          <StatCard
            title="Orçamentos em aberto"
            value={String(openBudgets?.length ?? 0)}
            icon={ClipboardList}
            href="/orcamentos"
          />
        )}

        {canViewSessions && (
          <>
            <StatCard title="Sessões do dia" value={String(sessionsToday?.length ?? 0)} icon={Wrench} href="/sessoes" />
            <StatCard
              title="Sessões pendentes de assinatura"
              value={String(pendingSignatureSessions.length)}
              icon={PenLine}
              href="/sessoes"
              emphasis={pendingSignatureSessions.length > 0}
            />
          </>
        )}

        {canViewRevenue && (
          <StatCard
            title="Contas a receber"
            value={formatCurrency(receivableTotal)}
            icon={CircleDollarSign}
            href="/financeiro?filter=receber"
          />
        )}

        {canViewExpense && (
          <StatCard
            title="Contas a pagar"
            value={formatCurrency(payableTotal)}
            icon={ReceiptText}
            href="/financeiro?filter=pagar"
          />
        )}

        {canViewInventory && (
          <StatCard
            title="Alertas de estoque"
            value={String(lowStockProducts.length + expiredProducts.length + expiringProducts.length)}
            icon={Package}
            href="/estoque"
            emphasis={lowStockProducts.length + expiredProducts.length + expiringProducts.length > 0}
          />
        )}
      </div>

      <AlertsPanel alerts={alerts} />
    </div>
  );
}
