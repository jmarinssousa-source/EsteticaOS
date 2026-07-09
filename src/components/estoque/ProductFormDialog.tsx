"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/estoque";
import type { ActionState } from "@/actions/auth";
import { PRODUCT_UNITS } from "@/lib/estoque/constants";
import type { Product } from "@/lib/estoque/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

function buildForm(product: Product) {
  return {
    name: product.name,
    category: product.category ?? "",
    quantity: String(product.quantity),
    unit: product.unit,
    batch: product.batch ?? "",
    expirationDate: product.expiration_date ?? "",
    cost: product.cost != null ? String(product.cost) : "",
    price: product.price != null ? String(product.price) : "",
    minStock: String(product.min_stock),
    notes: product.notes ?? "",
  };
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) onCreated();
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name && <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" name="category" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade</Label>
          <Select name="unit" defaultValue="un">
            <SelectTrigger id="unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input id="quantity" name="quantity" type="number" min="0" step="0.01" defaultValue="0" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque mínimo</Label>
          <Input id="minStock" name="minStock" type="number" min="0" step="0.01" defaultValue="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batch">Lote</Label>
          <Input id="batch" name="batch" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Validade</Label>
          <Input id="expirationDate" name="expirationDate" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Custo (R$)</Label>
          <Input id="cost" name="cost" type="number" min="0" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" type="number" min="0" step="0.01" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Cadastrando..." : "Cadastrar produto"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => buildForm(product));

  function handleSave() {
    startTransition(async () => {
      const result = await updateProduct(product.id, form);
      if ("error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        onSaved();
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={form.unit} onValueChange={(v) => v && setForm((f) => ({ ...f, unit: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Estoque mínimo</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.minStock}
            onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lote</Label>
          <Input value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Validade</Label>
          <Input
            type="date"
            value={form.expirationDate}
            onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Custo (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Preço (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </div>

      <DialogFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function ProductFormDialog({ product }: { product: Product | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={product ? <Button variant="ghost" size="icon" className="size-8" /> : <Button size="sm" />}>
        {product ? <Pencil className="size-4" /> : (
          <>
            <Plus className="size-4" />
            Novo produto
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {product ? "Atualize os dados deste produto." : "Cadastre um produto ou insumo da clínica."}
          </DialogDescription>
        </DialogHeader>

        {product ? (
          <EditForm product={product} onSaved={() => setOpen(false)} />
        ) : (
          <CreateForm onCreated={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
