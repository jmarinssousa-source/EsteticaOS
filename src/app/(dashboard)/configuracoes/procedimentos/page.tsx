import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProcedureOption } from "@/lib/procedures/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProceduresManager } from "@/components/procedures/ProceduresManager";
import { SettingsBackLink } from "@/components/settings/SettingsBackLink";

export const metadata = { title: "Procedimentos — EstéticaOS" };

export default async function ProcedimentosPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const { data: procedures } = await supabase
    .from("procedures")
    .select("id, name, price")
    .eq("clinic_id", member.clinicId)
    .order("name");

  return (
    <div className="space-y-4">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Procedimentos</h1>
        <p className="text-sm text-muted-foreground">
          O catálogo da clínica. Tudo o que estiver aqui aparece na agenda, nos orçamentos, nos
          pacotes e nas sessões.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <CardDescription>
            Cadastre quantos quiser — os nomes são livres, então cabe qualquer protocolo da sua
            clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProceduresManager procedures={(procedures ?? []) as ProcedureOption[]} />
        </CardContent>
      </Card>
    </div>
  );
}
