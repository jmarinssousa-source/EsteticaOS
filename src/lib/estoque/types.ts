import type { ProductStatus } from "@/lib/estoque/constants";

export type Product = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  batch: string | null;
  expiration_date: string | null;
  cost: number | null;
  price: number | null;
  min_stock: number;
  notes: string | null;
  status: ProductStatus;
  created_at: string;
};

export function isLowStock(product: Pick<Product, "quantity" | "min_stock">) {
  return product.min_stock > 0 && product.quantity <= product.min_stock;
}

export function isExpired(expirationDate: string | null, today: string) {
  return Boolean(expirationDate) && expirationDate! < today;
}

export function isExpiringSoon(expirationDate: string | null, today: string, soonDate: string) {
  return Boolean(expirationDate) && expirationDate! >= today && expirationDate! <= soonDate;
}
