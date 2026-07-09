import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { BUDGET_STATUS_LABELS, type BudgetStatus } from "@/lib/orcamentos/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetItemsTable } from "@/components/orcamentos/BudgetItemsTable";
import { BudgetStatusActions } from "@/components/orcamentos/BudgetStatusActions";
import { BudgetNotesForm } from "@/components/orcamentos/BudgetNotesForm";

export const metadata = { title: "Orçamento — EstéticaOS" };

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requirePermission("budgets_view");
  const canEdit = hasPermission(member, "budgets_edit");

  const supabase = await createClient();
  const { data: budget } = await supabase
    .from("budgets")
    .select("id, status, discount, total_value, notes, created_at, patients(id, name)")
    .eq("id", id)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!budget) notFound();

  const [{ data: items }, { data: procedures }, { data: packages }, { data: professionals }] = await Promise.all([
    supabase
      .from("budget_items")
      .select(
        "id, budget_id, procedure_id, package_id, quantity, unit_price, discount, professional_id, commission",
      )
      .eq("budget_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
    supabase
      .from("packages")
      .select("id, name, total_sessions, price, validity_days")
      .eq("clinic_id", member.clinicId)
      .order("name"),
    supabase
      .from("clinic_members")
      .select("user_id, full_name")
      .eq("clinic_id", member.clinicId)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const patient = budget.patients as unknown as { id: string; name: string } | null;
  const status = budget.status as BudgetStatus;

  return (
    <div className="space-y-4">
      <Link
        href="/orcamentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Orçamentos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{patient?.name ?? "Orçamento"}</h1>
          <p className="text-sm text-muted-foreground">
            Criado em {new Date(budget.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {BUDGET_STATUS_LABELS[status]}
        </Badge>
      </div>

      {canEdit && <BudgetStatusActions budgetId={budget.id} status={status} />}

      <Card>
        <CardHeader>
          <CardTitle>Procedimentos e pacotes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <BudgetItemsTable
            budgetId={budget.id}
            items={items ?? []}
            procedures={procedures ?? []}
            packages={packages ?? []}
            professionals={professionals ?? []}
            canEdit={canEdit && status === "open"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BudgetNotesForm
            budgetId={budget.id}
            notes={budget.notes}
            discount={Number(budget.discount)}
            canEdit={canEdit && status === "open"}
          />
          <p className="text-xl font-bold">Total: {formatCurrency(Number(budget.total_value))}</p>
        </CardContent>
      </Card>
    </div>
  );
}
