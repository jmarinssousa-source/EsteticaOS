import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/financeiro/constants";
import { PrintButton } from "@/components/consent/PrintButton";
import { WhatsAppReceiptButton } from "@/components/financeiro/WhatsAppReceiptButton";

export const metadata = { title: "Recibo — EstéticaOS" };

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requirePermission("finance_view");

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("financial_entries")
    .select("id, description, amount, payment_date, payment_method, status, patient_id, type")
    .eq("id", id)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!entry || entry.type !== "revenue" || entry.status !== "paid") notFound();

  const { data: patient } = entry.patient_id
    ? await supabase.from("patients").select("name, cpf, phone").eq("id", entry.patient_id).maybeSingle()
    : { data: null };

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, cnpj, phone, email, address")
    .eq("id", member.clinicId)
    .single();

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6 print:p-10">
      <div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{clinic?.name}</h1>
          <div className="mt-1 space-y-0.5">
            {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
            <p className="text-xs text-muted-foreground">
              {[clinic?.phone, clinic?.cnpj ? `CNPJ: ${clinic.cnpj}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 print:hidden">
          <PrintButton label="Salvar como PDF" />
          <WhatsAppReceiptButton
            clinicName={clinic?.name ?? ""}
            patientName={patient?.name ?? null}
            amount={entry.amount}
            paymentDate={entry.payment_date}
            patientPhone={patient?.phone ?? null}
          />
        </div>
      </div>

      <h2 className="text-center text-lg font-semibold tracking-wide">Recibo</h2>

      <div className="space-y-1 text-sm">
        {patient && (
          <p>
            Recebemos de <strong>{patient.name}</strong>
            {patient.cpf && ` (CPF ${patient.cpf})`} a importância de{" "}
            <strong>{formatCurrency(entry.amount)}</strong> referente a: {entry.description}.
          </p>
        )}
        {!patient && (
          <p>
            Recebemos a importância de <strong>{formatCurrency(entry.amount)}</strong> referente a:{" "}
            {entry.description}.
          </p>
        )}
        <p className="text-muted-foreground">
          Forma de pagamento:{" "}
          {entry.payment_method ? PAYMENT_METHOD_LABELS[entry.payment_method as PaymentMethod] : "Não informada"}
        </p>
        <p className="text-muted-foreground">
          Data do pagamento:{" "}
          {entry.payment_date ? new Date(entry.payment_date).toLocaleDateString("pt-BR") : "—"}
        </p>
      </div>

      <p className="pt-8 text-center text-sm text-muted-foreground">
        {clinic?.name} · {new Date().toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
