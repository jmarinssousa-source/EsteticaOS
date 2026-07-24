"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { PATIENT_MEDIA_BUCKET } from "@/lib/prontuario/constants";
import { generateReceiptPdf } from "@/lib/receipts/generateReceiptPdf";
import { generateBudgetPdf, type BudgetPdfItem } from "@/lib/receipts/generateBudgetPdf";
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

export async function getBudgetPdfUrl(budgetId: string): Promise<{ url: string } | { error: string }> {
  const member = await requirePermission("budgets_view");
  const supabase = await createClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("id, discount, total_value, notes, created_at, patient_id, patients(name, cpf)")
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!budget) return { error: "Orçamento não encontrado." };

  const { data: items } = await supabase
    .from("budget_items")
    .select("quantity, unit_price, discount, procedures(name), packages(name)")
    .eq("budget_id", budgetId)
    .order("created_at", { ascending: true });

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, cnpj, phone, address")
    .eq("id", member.clinicId)
    .single();

  if (!clinic) return { error: "Clínica não encontrada." };

  const patient = budget.patients as unknown as { name: string; cpf: string | null } | null;

  const pdfItems: BudgetPdfItem[] = (items ?? []).map((item) => {
    const procedure = item.procedures as unknown as { name: string } | null;
    const pkg = item.packages as unknown as { name: string } | null;
    return {
      label: pkg?.name ?? procedure?.name ?? "Item",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      discount: Number(item.discount),
    };
  });

  const pdfBytes = await generateBudgetPdf({
    clinic: {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      cnpj: clinic.cnpj,
    },
    patient: patient ? { name: patient.name, cpf: patient.cpf } : null,
    items: pdfItems,
    discount: Number(budget.discount),
    total: Number(budget.total_value),
    createdAt: budget.created_at,
    notes: budget.notes,
  });

  const path = `${member.clinicId}/budgets/${budget.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(PATIENT_MEDIA_BUCKET)
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) return { error: "Não foi possível gerar o PDF do orçamento." };

  const { data: signed, error: signError } = await supabase.storage
    .from(PATIENT_MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) return { error: "Não foi possível gerar o link do orçamento." };

  return { url: signed.signedUrl };
}
