import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/consent/PrintButton";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { Wordmark } from "@/components/brand/Logo";

export const metadata = { title: "Anamnese do paciente — EstéticaOS" };

type Answer = string | string[] | undefined;

function formatAnswer(value: Answer) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return value;
}

export default async function AnamnesePrintPage({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>;
}) {
  const { id, responseId } = await params;
  const member = await requirePermission("patients_view");

  const supabase = await createClient();
  const [{ data: patient }, { data: clinic }, { data: response }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, name, cpf, birth_date, phone")
      .eq("id", id)
      .eq("clinic_id", member.clinicId)
      .maybeSingle(),
    supabase
      .from("clinics")
      .select("name, cnpj, phone, address")
      .eq("id", member.clinicId)
      .maybeSingle(),
    supabase
      .from("anamnesis_responses")
      .select(
        "id, status, answers, completed_at, created_at, anamnesis_templates(name, anamnesis_questions(id, label, position))",
      )
      .eq("id", responseId)
      .eq("patient_id", id)
      .eq("clinic_id", member.clinicId)
      .maybeSingle(),
  ]);

  if (!patient || !response || response.status === "pending") notFound();

  const template = response.anamnesis_templates as unknown as {
    name: string;
    anamnesis_questions: { id: string; label: string; position: number }[];
  } | null;

  if (!template) notFound();

  const answers = (response.answers ?? {}) as Record<string, string | string[]>;
  const questions = [...template.anamnesis_questions].sort((a, b) => a.position - b.position);

  const contactLine = [clinic?.phone, clinic?.cnpj ? `CNPJ: ${clinic.cnpj}` : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 print:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{clinic?.name ?? member.clinicName}</p>
          {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
          {contactLine && <p className="text-xs text-muted-foreground">{contactLine}</p>}
        </div>
        <PrintButton />
      </div>

      <div className="border-t pt-4">
        <h1 className="text-xl font-bold">{template.name}</h1>
        <p className="text-sm">
          Paciente: <strong>{patient.name}</strong>
          {patient.cpf ? ` · CPF ${patient.cpf}` : ""}
          {patient.birth_date
            ? ` · Nascimento ${new Date(`${patient.birth_date}T00:00:00`).toLocaleDateString("pt-BR")}`
            : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {response.completed_at
            ? `Preenchida em ${new Date(response.completed_at).toLocaleString("pt-BR")}`
            : `Enviada em ${new Date(response.created_at).toLocaleString("pt-BR")}`}
        </p>
      </div>

      <div className="divide-y rounded-md border print:rounded-none">
        {questions.map((question) => (
          <div key={question.id} className="space-y-0.5 p-3 break-inside-avoid">
            <p className="text-xs text-muted-foreground">{question.label}</p>
            <p className="text-sm font-medium">{formatAnswer(answers[question.id])}</p>
          </div>
        ))}
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
