import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicForm } from "@/components/settings/ClinicForm";

export const metadata = { title: "Minha clínica — EstéticaOS" };

export default async function ClinicaPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, cnpj, phone, email, address, stale_lead_days")
    .eq("id", member.clinicId)
    .single();

  if (!clinic) redirect("/hoje");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Minha clínica</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            {member.role === "owner"
              ? "Essas informações aparecem em recibos e comunicações da clínica."
              : "Somente o dono/admin pode editar estes dados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicForm clinic={clinic} readOnly={member.role !== "owner"} />
        </CardContent>
      </Card>
    </div>
  );
}
