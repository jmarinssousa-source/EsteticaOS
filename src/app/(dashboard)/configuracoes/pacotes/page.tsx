import { Plus, Pencil } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageFormDialog } from "@/components/packages/PackageFormDialog";
import { DeletePackageButton } from "@/components/packages/DeletePackageButton";

export const metadata = { title: "Pacotes — EstéticaOS" };

export default async function PacotesPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const [{ data: packages }, { data: procedures }] = await Promise.all([
    supabase
      .from("packages")
      .select("id, name, total_sessions, price, validity_days, notes, package_procedures(procedure_id)")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: true }),
    supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacotes</h1>
          <p className="text-sm text-muted-foreground">
            Agrupe sessões de procedimentos para vender de uma vez em um orçamento.
          </p>
        </div>
        <PackageFormDialog
          pkg={null}
          procedures={procedures ?? []}
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Novo pacote
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus pacotes</CardTitle>
          <CardDescription>Aparecem como item ao montar um orçamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!packages || packages.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum pacote criado ainda.</p>
          )}
          {packages?.map((pkg) => {
            const procedureIds = (pkg.package_procedures as { procedure_id: string }[]).map(
              (p) => p.procedure_id,
            );
            const procedureNames = procedureIds
              .map((id) => procedures?.find((p) => p.id === id)?.name)
              .filter(Boolean);

            return (
              <div key={pkg.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{pkg.name}</p>
                    <Badge variant="secondary">{pkg.total_sessions} sessões</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(pkg.price))} · {procedureNames.join(", ") || "sem procedimentos"}
                    {pkg.validity_days ? ` · válido por ${pkg.validity_days} dias` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <PackageFormDialog
                    pkg={{
                      id: pkg.id,
                      name: pkg.name,
                      total_sessions: pkg.total_sessions,
                      price: Number(pkg.price),
                      validity_days: pkg.validity_days,
                      notes: pkg.notes,
                      procedureIds,
                    }}
                    procedures={procedures ?? []}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-8">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeletePackageButton packageId={pkg.id} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
