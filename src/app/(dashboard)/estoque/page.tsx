import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { daysFromNow, formatCurrency } from "@/lib/format";
import { EXPIRING_SOON_DAYS } from "@/lib/estoque/constants";
import { isExpired, isExpiringSoon, isLowStock, type Product } from "@/lib/estoque/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductFormDialog } from "@/components/estoque/ProductFormDialog";

export const metadata = { title: "Estoque — EstéticaOS" };

export default async function EstoquePage() {
  const member = await requirePermission("inventory_view");
  const canEdit = hasPermission(member, "inventory_edit");

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, category, quantity, unit, batch, expiration_date, cost, price, min_stock, notes, status, created_at",
    )
    .eq("clinic_id", member.clinicId)
    .order("name");

  const today = new Date().toISOString().slice(0, 10);
  const soonDate = daysFromNow(EXPIRING_SOON_DAYS);

  const list = (products ?? []) as Product[];
  const lowStockCount = list.filter((p) => isLowStock(p)).length;
  const expiringCount = list.filter((p) => isExpiringSoon(p.expiration_date, today, soonDate)).length;
  const expiredCount = list.filter((p) => isExpired(p.expiration_date, today)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">Produtos, lotes, validade e alertas.</p>
        </div>
        {canEdit && <ProductFormDialog product={null} />}
      </div>

      {(lowStockCount > 0 || expiringCount > 0 || expiredCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {lowStockCount > 0 && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {lowStockCount} com estoque baixo
            </Badge>
          )}
          {expiringCount > 0 && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {expiringCount} vencendo em {EXPIRING_SOON_DAYS} dias
            </Badge>
          )}
          {expiredCount > 0 && (
            <Badge variant="outline" className="border-red-500 text-red-700">
              {expiredCount} vencido{expiredCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      )}

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Alertas</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((product) => {
                const lowStock = isLowStock(product);
                const expired = isExpired(product.expiration_date, today);
                const expiring = !expired && isExpiringSoon(product.expiration_date, today, soonDate);

                return (
                  <TableRow key={product.id} className={product.status === "inactive" ? "opacity-50" : undefined}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category ?? "—"}</TableCell>
                    <TableCell>
                      {product.quantity} {product.unit}
                    </TableCell>
                    <TableCell>{product.batch ?? "—"}</TableCell>
                    <TableCell>
                      {product.expiration_date
                        ? new Date(product.expiration_date).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>{product.price != null ? formatCurrency(product.price) : "—"}</TableCell>
                    <TableCell className="space-x-1">
                      {lowStock && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                          baixo
                        </Badge>
                      )}
                      {expired && (
                        <Badge variant="outline" className="border-red-500 text-red-700">
                          vencido
                        </Badge>
                      )}
                      {expiring && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                          vencendo
                        </Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <ProductFormDialog product={product} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
