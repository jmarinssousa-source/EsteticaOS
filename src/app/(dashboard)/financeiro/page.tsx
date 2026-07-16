import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, currentYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import { computeCommissionsByProfessional } from "@/lib/financeiro/queries";
import type { FinancialEntry } from "@/lib/financeiro/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntryFormDialog } from "@/components/financeiro/EntryFormDialog";
import { EntryRow } from "@/components/financeiro/EntryRow";
import { CashFlowChart } from "@/components/financeiro/CashFlowChart";

export const metadata = { title: "Financeiro — EstéticaOS" };

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "receber", label: "A receber" },
  { key: "pagar", label: "A pagar" },
  { key: "pagos", label: "Pagos" },
] as const;

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const member = await requirePermission("finance_view");
  const canEdit = hasPermission(member, "finance_edit");
  const canViewRevenue = hasPermission(member, "finance_revenue_view");
  const canViewExpense = hasPermission(member, "finance_expense_view");
  const canViewCommissions = hasPermission(member, "finance_commissions_view");

  const { filter = "todos" } = await searchParams;

  const allowedTypes = [
    ...(canViewRevenue ? ["revenue"] : []),
    ...(canViewExpense ? ["expense"] : []),
  ];

  const supabase = await createClient();

  let query = supabase
    .from("financial_entries")
    .select(
      "id, patient_id, sale_id, type, description, amount, due_date, payment_date, status, payment_method, commission_amount, nf_issued, nf_number, created_at",
    )
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: false });

  if (allowedTypes.length > 0) {
    query = query.in("type", allowedTypes);
  }

  if (filter === "receber") query = query.eq("type", "revenue").in("status", ["pending", "overdue"]);
  else if (filter === "pagar") query = query.eq("type", "expense").in("status", ["pending", "overdue"]);
  else if (filter === "pagos") query = query.eq("status", "paid");

  const { data: entries } = allowedTypes.length > 0 ? await query : { data: [] };

  // Independent of the `filter` tab above — always reflects the full
  // clinic's revenue/expense split, so the summary tiles and chart don't
  // shift when the user is just browsing a filtered list below.
  let cashFlowData: { label: string; pago: number; pendente: number }[] = [];
  let receivableTotal = 0;
  let payableTotal = 0;
  let receivedTotal = 0;
  let paidExpenseTotal = 0;
  if (allowedTypes.length > 0) {
    const { data: summaryEntries } = await supabase
      .from("financial_entries")
      .select("type, status, amount")
      .eq("clinic_id", member.clinicId)
      .in("type", allowedTypes);

    for (const entry of summaryEntries ?? []) {
      const amount = Number(entry.amount);
      if (entry.type === "revenue") {
        if (entry.status === "paid") receivedTotal += amount;
        else receivableTotal += amount;
      } else {
        if (entry.status === "paid") paidExpenseTotal += amount;
        else payableTotal += amount;
      }
    }

    cashFlowData = [
      ...(canViewRevenue ? [{ label: "Receita", pago: receivedTotal, pendente: receivableTotal }] : []),
      ...(canViewExpense ? [{ label: "Despesa", pago: paidExpenseTotal, pendente: payableTotal }] : []),
    ];
  }

  const patientIds = [...new Set((entries ?? []).map((e) => e.patient_id).filter((id): id is string => Boolean(id)))];
  const { data: patients } =
    patientIds.length > 0
      ? await supabase.from("patients").select("id, name").in("id", patientIds)
      : { data: [] };

  let commissions: { professionalId: string; amount: number }[] = [];
  let professionalNames: Record<string, string> = {};
  if (canViewCommissions) {
    const yearMonth = currentYearMonth();
    const periodStart = `${yearMonth}-01`;
    const periodEnd = new Date(
      Number(yearMonth.slice(0, 4)),
      Number(yearMonth.slice(5, 7)),
      0,
    )
      .toISOString()
      .slice(0, 10);

    commissions = await computeCommissionsByProfessional(supabase, member.clinicId, periodStart, periodEnd);
    const professionalIds = commissions.map((c) => c.professionalId);
    if (professionalIds.length > 0) {
      const { data: members } = await supabase
        .from("clinic_members")
        .select("user_id, full_name")
        .in("user_id", professionalIds);
      professionalNames = Object.fromEntries((members ?? []).map((m) => [m.user_id, m.full_name]));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Receitas, despesas e comissões da clínica.</p>
        </div>
        {canEdit && <EntryFormDialog patients={patients ?? []} />}
      </div>

      {cashFlowData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo financeiro</CardTitle>
            <CardDescription>Receita e despesa, pago/recebido contra o que ainda está pendente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {canViewRevenue && (
                <>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Recebido</p>
                    <p className="text-lg font-semibold text-sage">{formatCurrency(receivedTotal)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">A receber</p>
                    <p className="text-lg font-semibold text-champagne">{formatCurrency(receivableTotal)}</p>
                  </div>
                </>
              )}
              {canViewExpense && (
                <>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Pago</p>
                    <p className="text-lg font-semibold text-sage">{formatCurrency(paidExpenseTotal)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">A pagar</p>
                    <p className="text-lg font-semibold text-champagne">{formatCurrency(payableTotal)}</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <CashFlowChart data={cashFlowData} />
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-sage" /> Pago / recebido
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-champagne" /> Pendente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-1 rounded-lg border p-0.5 sm:w-fit">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/financeiro?filter=${f.key}`}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries as FinancialEntry[] | null)?.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  patientName={patients?.find((p) => p.id === entry.patient_id)?.name ?? null}
                  canEdit={canEdit}
                />
              ))}
            </TableBody>
          </Table>
          {(!entries || entries.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado.</p>
          )}
        </CardContent>
      </Card>

      {canViewCommissions && (
        <Card>
          <CardHeader>
            <CardTitle>Comissões do mês</CardTitle>
            <CardDescription>
              Calculadas com base nas regras de Configurações &gt; Comissões (ou no valor manual do orçamento,
              quando não há regra configurada).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {commissions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma comissão a pagar neste mês.</p>
            )}
            {commissions.map((c) => (
              <div key={c.professionalId} className="flex items-center justify-between text-sm">
                <span>{professionalNames[c.professionalId] ?? "Profissional"}</span>
                <span className="font-medium">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
