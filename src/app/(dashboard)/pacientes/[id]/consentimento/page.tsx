import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_FORM_TEXT, DEFAULT_CONSENT_TEMPLATE_NAME } from "@/lib/consent/text";
import { PrintButton } from "@/components/consent/PrintButton";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { Wordmark } from "@/components/brand/Logo";

export const metadata = { title: "Termo de consentimento — EstéticaOS" };

export default async function ConsentimentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ termo?: string }>;
}) {
  const { id } = await params;
  const { termo } = await searchParams;
  const member = await requirePermission("patients_view");

  const supabase = await createClient();
  const [{ data: patient }, { data: clinic }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, name, cpf")
      .eq("id", id)
      .eq("clinic_id", member.clinicId)
      .maybeSingle(),
    supabase
      .from("clinics")
      .select("name, cnpj, phone, address")
      .eq("id", member.clinicId)
      .maybeSingle(),
  ]);

  if (!patient) notFound();

  // Sem `?termo=`, mostra o mais recente assinado — que é como a tela do
  // paciente chamava esta página antes dos termos múltiplos.
  const query = supabase
    .from("consent_forms")
    .select("id, title, patient_signature, signed_at, content")
    .eq("patient_id", id)
    .eq("clinic_id", member.clinicId)
    .eq("status", "signed");

  const { data: consent } = termo
    ? await query.eq("id", termo).maybeSingle()
    : await query.order("signed_at", { ascending: false }).limit(1).maybeSingle();

  if (!consent) notFound();

  const contactLine = [clinic?.phone, clinic?.cnpj ? `CNPJ: ${clinic.cnpj}` : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 print:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{clinic?.name ?? member.clinicName}</p>
          {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
          {contactLine && <p className="text-xs text-muted-foreground">{contactLine}</p>}
        </div>
        <PrintButton />
      </div>

      <h1 className="border-t pt-4 text-xl font-bold">
        {consent.title ?? DEFAULT_CONSENT_TEMPLATE_NAME}
      </h1>

      <p className="text-sm">
        Paciente: <strong>{patient.name}</strong>
        {patient.cpf ? ` · CPF ${patient.cpf}` : ""}
      </p>

      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {consent.content ?? CONSENT_FORM_TEXT}
      </p>

      <div className="space-y-2 pt-4">
        {consent.patient_signature && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={consent.patient_signature}
            alt="Assinatura do paciente"
            className="h-28 rounded-md border bg-white object-contain"
          />
        )}
        {consent.signed_at && (
          <p className="text-xs text-muted-foreground">
            Assinado em {new Date(consent.signed_at).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-2 border-t pt-4">
        <span className="text-[10px] text-muted-foreground">
          Documento gerado por <Wordmark className="text-[10px]" />
        </span>
        <OrbyniqBadge className="items-end text-right" />
      </footer>
    </div>
  );
}
