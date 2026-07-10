"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { PATIENT_MEDIA_BUCKET } from "@/lib/prontuario/constants";
import { generateReceiptPdf } from "@/lib/receipts/generateReceiptPdf";
import type { PaymentMethod } from "@/lib/financeiro/constants";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — enough to open a link shared once over WhatsApp

export async function getReceiptPdfUrl(entryId: string): Promise<{ url: string } | { error: string }> {
  const member = await requirePermission("finance_view");
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("financial_entries")
    .select("id, description, amount, payment_date, payment_method, status, patient_id, type")
    .eq("id", entryId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!entry || entry.type !== "revenue" || entry.status !== "paid") {
    return { error: "Recibo não encontrado." };
  }

  const { data: patient } = entry.patient_id
    ? await supabase.from("patients").select("name, cpf").eq("id", entry.patient_id).maybeSingle()
    : { data: null };

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, cnpj, phone, address")
    .eq("id", member.clinicId)
    .single();

  if (!clinic) return { error: "Clínica não encontrada." };

  const pdfBytes = await generateReceiptPdf({
    clinic: {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      cnpj: clinic.cnpj,
    },
    patient: patient ? { name: patient.name, cpf: patient.cpf } : null,
    amount: entry.amount,
    description: entry.description,
    paymentMethod: entry.payment_method as PaymentMethod | null,
    paymentDate: entry.payment_date,
  });

  const path = `${member.clinicId}/receipts/${entry.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(PATIENT_MEDIA_BUCKET)
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) return { error: "Não foi possível gerar o PDF do recibo." };

  const { data: signed, error: signError } = await supabase.storage
    .from(PATIENT_MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) return { error: "Não foi possível gerar o link do recibo." };

  return { url: signed.signedUrl };
}
