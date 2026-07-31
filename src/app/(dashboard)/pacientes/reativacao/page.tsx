import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_INACTIVE_PATIENT_DAYS,
  getInactivePatients,
} from "@/lib/patients/reactivation";
import { Button } from "@/components/ui/button";
import { ReactivationList } from "@/components/patients/ReactivationList";

export const metadata = { title: "Reativação de pacientes — EstéticaOS" };

export default async function ReativacaoPage() {
  const member = await requirePermission("patients_view");
  const supabase = await createClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, inactive_patient_days")
    .eq("id", member.clinicId)
    .single();

  const inactiveDays = clinic?.inactive_patient_days ?? DEFAULT_INACTIVE_PATIENT_DAYS;
  const patients = await getInactivePatients(supabase, member.clinicId, inactiveDays);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reativação de pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Pacientes sem retorno há mais de {inactiveDays} dias e sem horário marcado. Quem já tem
            agendamento não aparece aqui. Ajuste o prazo em Configurações {">"} Minha clínica. Quem
            você tirar da lista some daqui, mas continua cadastrado em Pacientes.
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/pacientes" />}>
          <ArrowLeft className="size-4" />
          Todos os pacientes
        </Button>
      </div>

      <ReactivationList
        patients={patients}
        clinicName={clinic?.name ?? member.clinicName}
        inactiveDays={inactiveDays}
        canEdit={hasPermission(member, "patients_edit")}
      />
    </div>
  );
}
