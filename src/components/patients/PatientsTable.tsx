"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deletePatients } from "@/actions/patients";
import { describePatientSearch, PATIENT_PAGE_SIZES } from "@/lib/patients/search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeletePatientButton } from "@/components/patients/DeletePatientButton";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
};

export function PatientsTable({
  patients,
  canDelete = false,
  search,
  page,
  pageSize,
  totalPages,
  matchCount,
  totalCount,
}: {
  patients: Patient[];
  canDelete?: boolean;
  search: string;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Quantos pacientes a busca atual encontra no banco inteiro. */
  matchCount: number;
  /** Quantos pacientes a clínica tem no total, ignorando a busca. */
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // O campo é controlado localmente para não engasgar enquanto digita; a
  // URL só acompanha depois de uma pausa. Sem isso cada tecla viraria uma
  // consulta ao banco.
  const debounced = useRef(search);
  useEffect(() => {
    if (term === debounced.current) return;
    const timer = setTimeout(() => {
      debounced.current = term;
      navigate({ q: term, page: "1" });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  // Trocar de página ou de busca zera a seleção: manter marcado o que saiu
  // da tela é a receita para apagar alguém sem querer. O ajuste é feito na
  // renderização (e não num efeito) para a lista nunca chegar a aparecer
  // com a seleção antiga.
  const listKey = `${search}|${page}|${pageSize}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  if (listKey !== lastListKey) {
    setLastListKey(listKey);
    setSelected(new Set());
    setAllMatching(false);
  }

  function navigate(next: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { q: search, page: String(page), size: String(pageSize), ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.page !== "1") params.set("page", merged.page);
    if (merged.size !== String(PATIENT_PAGE_SIZES[0])) params.set("size", merged.size);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  }

  function toggle(id: string) {
    setAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage(checked: boolean) {
    setAllMatching(false);
    setSelected(checked ? new Set(patients.map((p) => p.id)) : new Set());
  }

  const pageAllSelected = patients.length > 0 && patients.every((p) => selected.has(p.id));
  const selectionCount = allMatching ? matchCount : selected.size;

  function handleBulkDelete() {
    startTransition(async () => {
      const result = allMatching
        ? await deletePatients({ allMatching: true, search })
        : await deletePatients({ ids: [...selected] });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.removed === 1
          ? "1 paciente excluído."
          : `${result.removed} pacientes excluídos.`,
      );
      setSelected(new Set());
      setAllMatching(false);
      router.refresh();
    });
  }

  const firstOnPage = matchCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastOnPage = Math.min(page * pageSize, matchCount);
  const hint = describePatientSearch(term);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, telefone ou CPF"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="pl-8"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <span>Por página:</span>
          {PATIENT_PAGE_SIZES.map((size) => (
            <Button
              key={size}
              type="button"
              size="sm"
              variant={pageSize === size ? "default" : "outline"}
              onClick={() => navigate({ size: String(size), page: "1" })}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {/* Barra de seleção: aparece só quando há algo marcado, e diz em
          números o que vai ser apagado antes de qualquer confirmação. */}
      {canDelete && selectionCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="font-medium">
            {selectionCount} paciente{selectionCount === 1 ? "" : "s"} selecionado
            {selectionCount === 1 ? "" : "s"}
          </span>
          {!allMatching && pageAllSelected && matchCount > patients.length && (
            <Button type="button" size="sm" variant="outline" onClick={() => setAllMatching(true)}>
              Selecionar os {matchCount} {search ? "encontrados" : "pacientes"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelected(new Set());
              setAllMatching(false);
            }}
          >
            Limpar seleção
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="ml-auto"
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Excluir selecionados
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {canDelete && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={pageAllSelected}
                      onCheckedChange={(checked) => togglePage(Boolean(checked))}
                      aria-label="Selecionar todos desta página"
                    />
                  </TableHead>
                )}
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
                {canDelete && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} data-state={selected.has(patient.id) ? "selected" : undefined}>
                  {canDelete && (
                    <TableCell>
                      <Checkbox
                        checked={allMatching || selected.has(patient.id)}
                        onCheckedChange={() => toggle(patient.id)}
                        aria-label={`Selecionar ${patient.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <Link href={`/pacientes/${patient.id}`} className="block hover:underline">
                      {patient.name}
                    </Link>
                  </TableCell>
                  <TableCell>{patient.phone ?? "—"}</TableCell>
                  <TableCell>{patient.email ?? "—"}</TableCell>
                  <TableCell>{patient.cpf ?? "—"}</TableCell>
                  {canDelete && (
                    <TableCell className="text-right">
                      <DeletePatientButton patientId={patient.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canDelete ? 6 : 4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {search
                      ? "Nenhum paciente encontrado para essa busca."
                      : "Nenhum paciente cadastrado ainda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sempre visível, mesmo com uma página só: é aqui que se confere se
          o total bate com o que foi importado. */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {matchCount === 0
            ? "Nenhum paciente para mostrar"
            : `Mostrando ${firstOnPage}–${lastOnPage} de ${matchCount}`}
          {search && ` (de ${totalCount} no total)`} · Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1 || isPending}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            Anterior
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages || isPending}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            Próxima
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {selectionCount} paciente{selectionCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Some junto o histórico de cada um: agendamentos, sessões, prontuário, fotos,
              orçamentos, anamneses e termos. Os lançamentos financeiros continuam no caixa, sem o
              vínculo. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBulkDelete} disabled={isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
