import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PatientFormDialog } from "@/components/patients/PatientFormDialog";
import { PatientsTable } from "@/components/patients/PatientsTable";

export const metadata = { title: "Pacientes — EstéticaOS" };

export default async function PacientesPage() {
  const member = await requirePermission("patients_view");
  const canEdit = hasPermission(member, "patients_edit");

  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, phone, email, cpf")
    .eq("clinic_id", member.clinicId)
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Busque por nome, telefone ou CPF.</p>
        </div>
        {canEdit && <PatientFormDialog />}
      </div>

      <PatientsTable patients={patients ?? []} />
    </div>
  );
}
