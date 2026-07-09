import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { BUDGET_STATUS_LABELS } from "@/lib/orcamentos/constants";
import type { BudgetStatus } from "@/lib/orcamentos/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewBudgetDialog } from "@/components/orcamentos/NewBudgetDialog";

export const metadata = { title: "Orçamentos — EstéticaOS" };

export default async function OrcamentosPage() {
  const member = await requirePermission("budgets_view");
  const canEdit = hasPermission(member, "budgets_edit");

  const supabase = await createClient();
  const [{ data: budgets }, { data: patients }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, status, total_value, created_at, patients(name)")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId).order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Monte orçamentos por paciente e converta em venda.</p>
        </div>
        {canEdit && <NewBudgetDialog patients={patients ?? []} />}
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
