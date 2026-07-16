import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BUDGET_STATUS_LABELS } from "@/lib/orcamentos/constants";
import type { BudgetStatus } from "@/lib/orcamentos/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewBudgetDialog } from "@/components/orcamentos/NewBudgetDialog";

export const metadata = { title: "Orçamentos — EstéticaOS" };

const SORT_OPTIONS = [
  { key: "name", label: "Nome" },
  { key: "date", label: "Data" },
] as const;

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const member = await requirePermission("budgets_view");
  const canEdit = hasPermission(member, "budgets_edit");
  const { sort = "name" } = await searchParams;
  const sortByName = sort !== "date";

  const supabase = await createClient();

  const [{ data: rawBudgets }, { data: patients }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, status, total_value, created_at, patients(name)")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId).order("name"),
  ]);

  // PostgREST's `referencedTable` ordering only reorders embedded child
  // arrays, not the parent rows in a many-to-one embed like this one — so
  // sorting by patient name has to happen in JS after the fetch.
  const budgets = sortByName
    ? [...(rawBudgets ?? [])].sort((a, b) => {
        const nameA = (a.patients as unknown as { name: string } | null)?.name ?? "";
        const nameB = (b.patients as unknown as { name: string } | null)?.name ?? "";
        return nameA.localeCompare(nameB, "pt-BR");
      })
    : rawBudgets;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Monte orçamentos por paciente e converta em venda.</p>
        </div>
        {canEdit && <NewBudgetDialog patients={patients ?? []} />}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Ordenar por:</span>
        <div className="flex gap-1 rounded-lg border p-0.5">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.key}
              href={`/orcamentos?sort=${option.key}`}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                sort === option.key || (option.key === "name" && sort !== "date")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets?.map((budget) => (
                <TableRow key={budget.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/orcamentos/${budget.id}`} className="block">
                      {(budget.patients as unknown as { name: string } | null)?.name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orcamentos/${budget.id}`} className="block">
                      <Badge variant="secondary">{BUDGET_STATUS_LABELS[budget.status as BudgetStatus]}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orcamentos/${budget.id}`} className="block">
                      {formatCurrency(Number(budget.total_value))}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orcamentos/${budget.id}`} className="block">
                      {new Date(budget.created_at).toLocaleDateString("pt-BR")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!budgets || budgets.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhum orçamento criado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
