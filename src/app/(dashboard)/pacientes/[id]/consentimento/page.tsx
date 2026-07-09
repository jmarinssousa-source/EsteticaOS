import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_FORM_TEXT } from "@/lib/consent/text";
import { PrintButton } from "@/components/consent/PrintButton";

export const metadata = { title: "Termo de consentimento — EstéticaOS" };

export default async function ConsentimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requirePermission("patients_view");

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("id", id)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!patient) notFound();

  const { data: consent } = await supabase
    .from("consent_forms")
    .select("patient_signature, signed_at")
    .eq("patient_id", id)
    .eq("clinic_id", member.clinicId)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!consent) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 print:p-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{member.clinicName}</p>
          <h1 className="text-xl font-bold">Termo de consentimento e autorização de imagem</h1>
        </div>
        <PrintButton />
      </div>

      <p className="text-sm">
        Paciente: <strong>{patient.name}</strong>
      </p>

      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {CONSENT_FORM_TEXT}
      </p>

      <div className="space-y-2 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={consent.patient_signature}
          alt="Assinatura do paciente"
          className="h-28 rounded-md border bg-white object-contain"
        />
        <p className="text-xs text-muted-foreground">
          Assinado em {new Date(consent.signed_at).toLocaleString("pt-BR")}
        </p>
      </div>
    </div>
  );
}
