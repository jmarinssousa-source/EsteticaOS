"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, Trash2, X } from "lucide-react";
import { createProcedure, deleteProcedure, updateProcedure } from "@/actions/procedures";
import type { ProcedureOption } from "@/lib/procedures/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Quantos cabem numa página sem virar rolagem infinita. */
const PAGE_SIZES = [25, 50, 100] as const;

type SortColumn = "name" | "price";
type Sort = { column: SortColumn; direction: "asc" | "desc" };

/**
 * Uma linha da tabela, editável ali mesmo.
 *
 * Cada linha guarda o próprio rascunho e só mostra "Salvar" quando algo
 * mudou de verdade. Editar direto na linha é o que faz sentido aqui: o
 * uso real é ajustar preço de vários procedimentos de uma vez, e abrir
 * uma janela para cada um transformaria cinco ajustes em quinze cliques.
 */
function ProcedureRow({ procedure }: { procedure: ProcedureOption }) {
  const [name, setName] = useState(procedure.name);
  const [price, setPrice] = useState(procedure.price != null ? String(procedure.price) : "");
  const [isPending, startTransition] = useTransition();

  // Compara como número: "1234.50" e 1234.5 são o mesmo preço.
  const changed =
    name.trim() !== procedure.name || Number(price || 0) !== Number(procedure.price ?? 0);

  function handleSave() {
    startTransition(async () => {
      const result = await updateProcedure(procedure.id, name, price);
      if ("error" in result) toast.error(result.error);
      else toast.success("Procedimento salvo.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProcedure(procedure.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Procedimento excluído.");
    });
  }

  return (
    <TableRow className={isPending ? "opacity-70" : undefined}>
      <TableCell className="py-2">
        <Input
          value={name}
          disabled={isPending}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Nome de ${procedure.name}`}
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-40 py-2">
        <CurrencyInput
          value={price}
          disabled={isPending}
          onValueChange={setPrice}
          aria-label={`Valor de ${procedure.name}`}
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-32 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* O botão só existe quando há o que salvar: linha parada não
              precisa oferecer uma ação que não faz nada. */}
          {changed && (
            <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
              Salvar
            </Button>
          )}
          <AlertDialog>
            <TooltipHint label="Excluir procedimento">
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:text-destructive"
                    aria-label={`Excluir ${procedure.name}`}
                  />
                }
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
            </TooltipHint>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir “{procedure.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  Só dá para excluir procedimentos que ainda não foram usados em agendamentos,
                  orçamentos, pacotes ou atendimentos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: Sort;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sort.column === column;
  const ascending = active && sort.direction === "asc";

  return (
    <TableHead
      className={className}
      aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        {active ? (
          ascending ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
        )}
        <span className="sr-only">Clique para ordenar por esta coluna.</span>
      </button>
    </TableHead>
  );
}

export function ProceduresManager({ procedures }: { procedures: ProcedureOption[] }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>({ column: "name", direction: "asc" });
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const matching = term
      ? procedures.filter((procedure) => procedure.name.toLocaleLowerCase("pt-BR").includes(term))
      : procedures;

    const factor = sort.direction === "asc" ? 1 : -1;
    return [...matching].sort((a, b) => {
      if (sort.column === "price") {
        // Sem preço vai para o fim nos dois sentidos: é pendência de
        // cadastro, não um procedimento que custa zero nem o mais caro
        // de todos. Inverter a ordem não deve jogar as pendências para
        // cima de quem só queria ver os valores mais altos.
        const missingA = a.price == null;
        const missingB = b.price == null;
        if (missingA !== missingB) return missingA ? 1 : -1;
        if (!missingA && !missingB && a.price !== b.price) {
          return (a.price! - b.price!) * factor;
        }
      }
      return a.name.localeCompare(b.name, "pt-BR") * factor;
    });
  }, [procedures, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstOnPage = (currentPage - 1) * pageSize;
  const visible = filtered.slice(firstOnPage, firstOnPage + pageSize);

  const withoutPrice = procedures.filter((procedure) => procedure.price == null).length;
  const total = procedures.reduce((sum, procedure) => sum + (procedure.price ?? 0), 0);

  function handleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
    setPage(1);
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createProcedure(trimmed, price);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Procedimento cadastrado.");
      setName("");
      setPrice("");
      // O novo entra em ordem alfabética, que pode ser em qualquer
      // página; limpar a busca ao menos garante que ele não fique
      // escondido atrás de um filtro.
      setSearch("");
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="newProcedure" className="text-xs text-muted-foreground">
            Novo procedimento
          </Label>
          <Input
            id="newProcedure"
            placeholder="Ex.: Limpeza de pele profunda"
            value={name}
            disabled={isPending}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
          <CurrencyInput value={price} disabled={isPending} onValueChange={setPrice} />
        </div>
        <Button type="submit" disabled={isPending || !name.trim()}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </form>

      {procedures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum procedimento cadastrado ainda. Comece pelos que a clínica mais faz.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Buscar procedimento pelo nome"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              <span>Por página:</span>
              {PAGE_SIZES.map((size) => (
                <Button
                  key={size}
                  type="button"
                  size="sm"
                  variant={pageSize === size ? "default" : "outline"}
                  onClick={() => {
                    setPageSize(size);
                    setPage(1);
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Procedimento" column="name" sort={sort} onSort={handleSort} />
                  <SortableHead label="Valor" column="price" sort={sort} onSort={handleSort} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((procedure) => (
                  <ProcedureRow key={procedure.id} procedure={procedure} />
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum procedimento com esse nome.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {filtered.length === 0
                ? "Nenhum procedimento para mostrar"
                : `Mostrando ${firstOnPage + 1}–${Math.min(
                    firstOnPage + pageSize,
                    filtered.length,
                  )} de ${filtered.length}`}
              {search && ` (de ${procedures.length} no catálogo)`} · Página {currentPage} de{" "}
              {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {procedures.length} procedimento{procedures.length === 1 ? "" : "s"} no catálogo
        {procedures.length > 0 && `, somando ${formatCurrency(total)} em valores de tabela`} · o
        valor preenche o orçamento automaticamente, mas pode ser alterado em cada venda.
        {withoutPrice > 0 &&
          ` ${withoutPrice} ainda ${withoutPrice === 1 ? "está" : "estão"} sem valor: ordene pela coluna Valor e ${
            withoutPrice === 1 ? "ele fica" : "eles ficam"
          } no fim da lista.`}
      </p>
    </div>
  );
}
