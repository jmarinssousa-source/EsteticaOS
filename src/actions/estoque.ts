"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { productSchema } from "@/lib/validations/estoque";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidateEstoque() {
  revalidatePath("/estoque");
  revalidatePath("/hoje");
}

function readProductForm(formData: FormData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    batch: formData.get("batch"),
    expirationDate: formData.get("expirationDate"),
    cost: formData.get("cost"),
    price: formData.get("price"),
    minStock: formData.get("minStock"),
    notes: formData.get("notes"),
  };
}

export async function createProduct(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("inventory_edit");
  const parsed = productSchema.safeParse(readProductForm(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { expirationDate, minStock, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    clinic_id: member.clinicId,
    expiration_date: expirationDate,
    min_stock: minStock,
    ...rest,
  });

  if (error) return { error: "Não foi possível cadastrar o produto." };

  revalidateEstoque();
  return { success: true };
}

export async function updateProduct(
  productId: string,
  patch: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    batch: string;
    expirationDate: string;
    cost: string;
    price: string;
    minStock: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("inventory_edit");
  const parsed = productSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { expirationDate, minStock, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ expiration_date: expirationDate, min_stock: minStock, ...rest })
    .eq("id", productId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o produto." };

  revalidateEstoque();
  return { success: true };
}

export async function toggleProductStatus(productId: string, status: "active" | "inactive"): Promise<ActionResult> {
  const member = await requirePermission("inventory_edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível atualizar o produto." };

  revalidateEstoque();
  return { success: true };
}
