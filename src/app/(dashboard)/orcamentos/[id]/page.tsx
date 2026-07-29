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
import { BudgetPdfActions } from "@/components/orcamentos/BudgetPdfActions";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { Wordmark } from "@/components/brand/Logo";

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
    .select("id, status, discount, total_value, notes, created_at, patients(id, name, phone)")
    .eq("id", id)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!budget) notFound();

  const [{ data: items }, { data: procedures }, { data: packages }, { data: professionals }, { data: clinic }] = await Promise.all([
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
    supabase
      .from("clinics")
      .select("name, cnpj, phone, address")
      .eq("id", member.clinicId)
      .single(),
  ]);

  const patient = budget.patients as unknown as { id: string; name: string; phone: string | null } | null;
  const status = budget.status as BudgetStatus;

  return (
    <div className="space-y-4">
      <Link
        href="/orcamentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Orçamentos
      </Link>

      {/* Cabeçalho só do impresso: na tela a clínica já está na barra
          lateral, mas o papel que vai para o paciente precisa dela. */}
      <div className="hidden border-b pb-3 print:block">
        <p className="text-base font-semibold">{clinic?.name}</p>
        {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
        {[clinic?.phone, clinic?.cnpj ? `CNPJ: ${clinic.cnpj}` : null].filter(Boolean).length > 0 && (
          <p className="text-xs text-muted-foreground">
            {[clinic?.phone, clinic?.cnpj ? `CNPJ: ${clinic.cnpj}` : null].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </div>

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

      <div className="flex flex-wrap items-center justify-between gap-2">
        {canEdit && (
          <BudgetStatusActions budgetId={budget.id} status={status} total={Number(budget.total_value)} />
        )}
        <BudgetPdfActions
          budgetId={budget.id}
          clinicName={clinic?.name ?? ""}
          patientName={patient?.name ?? null}
          patientPhone={patient?.phone ?? null}
          total={Number(budget.total_value)}
        />
      </div>

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

      <footer className="hidden flex-wrap items-end justify-between gap-2 border-t pt-3 print:flex">
        <span className="text-[10px] text-muted-foreground">
          Documento gerado por <Wordmark className="text-[10px]" />
        </span>
        <OrbyniqBadge className="items-end text-right" />
      </footer>
    </div>
  );
}
