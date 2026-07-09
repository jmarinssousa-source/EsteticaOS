import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { COMMISSION_BASIS_LABELS, type CommissionBasis } from "@/lib/financeiro/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionRuleFormDialog } from "@/components/financeiro/CommissionRuleFormDialog";
import { DeleteRuleButton } from "@/components/financeiro/DeleteRuleButton";

export const metadata = { title: "Comissões — EstéticaOS" };

export default async function ComissoesPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const [{ data: rules }, { data: professionals }, { data: procedures }] = await Promise.all([
    supabase
      .from("commission_rules")
      .select("id, professional_id, procedure_id, basis, rate_percent")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: true }),
    supabase
      .from("clinic_members")
      .select("user_id, full_name")
      .eq("clinic_id", member.clinicId)
      .eq("status", "active")
      .order("full_name"),
    supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comissões</h1>
          <p className="text-sm text-muted-foreground">
            Defina percentuais de comissão por profissional e/ou procedimento.
          </p>
        </div>
        <CommissionRuleFormDialog professionals={professionals ?? []} procedures={procedures ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas regras</CardTitle>
          <CardDescription>
            A regra mais específica vence. Sem nenhuma regra aplicável, o relatório de comissões usa o valor
            manual lançado no orçamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!rules || rules.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhuma regra criada ainda.</p>
          )}
          {rules?.map((rule) => {
            const professional = professionals?.find((p) => p.user_id === rule.professional_id);
            const procedure = procedures?.find((p) => p.id === rule.procedure_id);
            return (
              <div key={rule.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{rule.rate_percent}%</p>
                  <p className="text-xs text-muted-foreground">
                    {professional?.full_name ?? "Todos os profissionais"} ·{" "}
                    {procedure?.name ?? "Todos os procedimentos"} ·{" "}
                    {COMMISSION_BASIS_LABELS[rule.basis as CommissionBasis]}
                  </p>
                </div>
                <DeleteRuleButton ruleId={rule.id} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
