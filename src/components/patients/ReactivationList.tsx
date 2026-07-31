"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarPlus,
  CheckCheck,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { dismissFromReactivation, restoreToReactivation } from "@/actions/patients";
import type { InactivePatient } from "@/lib/patients/reactivation";
import {
  DEFAULT_REACTIVATION_MESSAGE,
  REACTIVATION_TEMPLATE_KEY,
  renderPatientMessage,
} from "@/lib/patients/messages";
import { useMessageTemplate } from "@/lib/patients/use-message-template";
import { PATIENT_PAGE_SIZES } from "@/lib/patients/search";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import { MessageTemplateEditor } from "@/components/patients/MessageTemplateEditor";
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

type SortColumn = "name" | "lastVisit";
type SortDirection = "asc" | "desc";
type Sort = { column: SortColumn; direction: SortDirection };

/**
 * Ordena a lista pela coluna escolhida.
 *
 * Por última visita, quem nunca veio entra com chave vazia, que ordena
 * antes de qualquer data: na ordem crescente aparece no topo, que é onde
 * deve estar, e na decrescente vai para o fim. Empate de data é desfeito
 * por quem está sem voltar há mais tempo e depois pelo nome, para a
 * lista não dançar entre duas renderizações.
 */
function sortPatients(patients: InactivePatient[], sort: Sort) {
  const factor = sort.direction === "asc" ? 1 : -1;

  return [...patients].sort((a, b) => {
    if (sort.column === "name") {
      return a.name.localeCompare(b.name, "pt-BR") * factor;
    }
    const keyA = a.lastVisit ?? "";
    const keyB = b.lastVisit ?? "";
    if (keyA !== keyB) return keyA < keyB ? -factor : factor;
    if (a.daysSince !== b.daysSince) return b.daysSince - a.daysSince;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

/** Cabeçalho que ordena a tabela, com a seta do sentido atual. */
function SortableHead({
  label,
  column,
  sort,
  onSort,
  hint,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: Sort;
  onSort: (column: SortColumn) => void;
  /** Como a ordem é dita em voz alta, para leitor de tela. */
  hint: { asc: string; desc: string };
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
        <span className="sr-only">
          {active
            ? `${ascending ? hint.asc : hint.desc} Clique para inverter.`
            : "Clique para ordenar por esta coluna."}
        </span>
      </button>
    </TableHead>
  );
}

export function ReactivationList({
  patients,
  clinicName,
  inactiveDays,
  canEdit,
}: {
  patients: InactivePatient[];
  clinicName: string;
  inactiveDays: number;
  canEdit: boolean;
}) {
  const { template, save } = useMessageTemplate(
    REACTIVATION_TEMPLATE_KEY,
    DEFAULT_REACTIVATION_MESSAGE,
  );

  const [pendingRemoval, setPendingRemoval] = useState<InactivePatient | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_REACTIVATION_MESSAGE);

  // Padrão: quem está sem voltar há mais tempo primeiro, que é a ordem
  // de quem mais precisa de um contato.
  const [sort, setSort] = useState<Sort>({ column: "lastVisit", direction: "asc" });
  const [pageSize, setPageSize] = useState<number>(PATIENT_PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

  const ordered = useMemo(() => sortPatients(patients, sort), [patients, sort]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  // A página é limitada na renderização, e não num efeito: tirar alguém
  // da lista pode encolher o total e deixar a página atual sem linhas, e
  // a tabela não pode chegar a aparecer vazia por um quadro.
  const currentPage = Math.min(page, totalPages);
  const firstOnPage = (currentPage - 1) * pageSize;
  const visible = ordered.slice(firstOnPage, firstOnPage + pageSize);

  function handleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : // Trocar de coluna começa no sentido mais útil de cada uma:
          // nome em A-Z, data pela visita mais antiga.
          { column, direction: "asc" },
    );
    setPage(1);
  }

  /**
   * Tira o paciente da lista.
   *
   * Os dois botões acabam aqui: o de "mensagem enviada", que é rotina do
   * dia, e o da lixeira, que é para quem não é mais paciente. Só muda o
   * aviso que aparece depois. Os dois trazem "Desfazer", porque nenhuma
   * das duas é uma decisão que mereça um caminho de volta trabalhoso.
   */
  function removeFromList(patient: InactivePatient, message: string) {
    startTransition(async () => {
      const result = await dismissFromReactivation(patient.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(message, {
        description: "O cadastro do paciente continua em Pacientes.",
        action: {
          label: "Desfazer",
          onClick: () => {
            startTransition(async () => {
              const undo = await restoreToReactivation(patient.id);
              if ("error" in undo && undo.error) toast.error(undo.error);
            });
          },
        },
      });
    });
  }

  function confirmRemoval() {
    const patient = pendingRemoval;
    if (!patient) return;
    setPendingRemoval(null);
    removeFromList(patient, `${patient.name} saiu da lista de reativação.`);
  }

  const editor = (
    <Dialog open={editing} onOpenChange={setEditing}>
      <DialogContent className="sm:max-w-lg">
        <MessageTemplateEditor
          title="Mensagem de reativação"
          draft={draft}
          onDraftChange={setDraft}
          defaultMessage={DEFAULT_REACTIVATION_MESSAGE}
          previewName={patients[0]?.name ?? "Maria"}
          clinicName={clinicName}
          onCancel={() => setEditing(false)}
          onSave={() => {
            save(draft);
            setEditing(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  function openEditor() {
    setDraft(template);
    setEditing(true);
  }

  if (patients.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={openEditor}>
            <Pencil className="size-4" />
            Editar mensagem
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum paciente parado há mais de {inactiveDays} dias. Sua base está em dia.
          </CardContent>
        </Card>
        {editor}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={openEditor}>
          <Pencil className="size-4" />
          Editar mensagem
        </Button>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <span>Por página:</span>
          {PATIENT_PAGE_SIZES.map((size) => (
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

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Paciente"
                  column="name"
                  sort={sort}
                  onSort={handleSort}
                  hint={{
                    asc: "Ordenado de A a Z.",
                    desc: "Ordenado de Z a A.",
                  }}
                />
                <SortableHead
                  label="Última visita"
                  column="lastVisit"
                  sort={sort}
                  onSort={handleSort}
                  hint={{
                    asc: "Ordenado da visita mais antiga para a mais recente.",
                    desc: "Ordenado da visita mais recente para a mais antiga.",
                  }}
                />
                <TableHead>Sem voltar há</TableHead>
                <TableHead className="text-right">Contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((patient) => (
                <TableRow key={patient.id} className={cn(isPending && "opacity-70")}>
                  <TableCell className="font-medium">
                    <Link href={`/pacientes/${patient.id}`} className="hover:underline">
                      {patient.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.lastVisit
                      ? new Date(`${patient.lastVisit}T00:00:00`).toLocaleDateString("pt-BR")
                      : "Nunca veio"}
                  </TableCell>
                  <TableCell>{patient.daysSince} dias</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {patient.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={
                            <a
                              href={buildWhatsAppUrl(
                                patient.phone,
                                renderPatientMessage(template, patient.name, clinicName),
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <MessageCircle className="size-4" />
                          WhatsApp
                        </Button>
                      )}
                      {canEdit && (
                        <TooltipHint label="Já mandei a mensagem: tirar da lista">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-emerald-600"
                            aria-label={`Marcar mensagem enviada para ${patient.name}`}
                            onClick={() =>
                              removeFromList(patient, `Mensagem marcada como enviada para ${patient.name}.`)
                            }
                          >
                            <CheckCheck className="size-4" />
                          </Button>
                        </TooltipHint>
                      )}
                      <TooltipHint label="Marcar um retorno na agenda">
                        <Button
                          size="sm"
                          variant="ghost"
                          nativeButton={false}
                          aria-label={`Agendar retorno de ${patient.name}`}
                          render={<Link href="/agenda" />}
                        >
                          <CalendarPlus className="size-4" />
                        </Button>
                      </TooltipHint>
                      {canEdit && (
                        <TooltipHint label="Não é mais paciente: tirar da lista">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Tirar ${patient.name} da lista de reativação`}
                            onClick={() => setPendingRemoval(patient)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipHint>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando {firstOnPage + 1}–{Math.min(firstOnPage + pageSize, ordered.length)} de{" "}
          {ordered.length} · Página {currentPage} de {totalPages}
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

      {editor}

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tirar {pendingRemoval?.name} da lista de reativação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O cadastro, o histórico e o prontuário continuam do jeito que estão. O nome só deixa
              de aparecer aqui e de contar no alerta do Hoje. Se essa pessoa voltar a se consultar,
              ela volta para a lista quando ficar sem retorno de novo.
              <br />
              <br />
              Para apagar o cadastro de vez, use a exclusão na tela de Pacientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval}>Tirar da lista</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
