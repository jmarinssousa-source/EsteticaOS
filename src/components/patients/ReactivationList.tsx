"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlus, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dismissFromReactivation, restoreToReactivation } from "@/actions/patients";
import type { InactivePatient } from "@/lib/patients/reactivation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

function reactivationMessage(patient: InactivePatient, clinicName: string) {
  return (
    `Oi, ${firstName(patient.name)}! Tudo bem? Aqui é da ${clinicName}. ` +
    `Faz um tempinho que a gente não se vê e queria saber como você está. ` +
    `Quer marcar um horário?`
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
  const [pendingRemoval, setPendingRemoval] = useState<InactivePatient | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmRemoval() {
    const patient = pendingRemoval;
    if (!patient) return;
    setPendingRemoval(null);

    startTransition(async () => {
      const result = await dismissFromReactivation(patient.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      // O cadastro segue lá, então a mensagem diz exatamente o que
      // aconteceu, e o "Desfazer" cobre o clique na linha errada.
      toast.success(`${patient.name} saiu da lista de reativação.`, {
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

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum paciente parado há mais de {inactiveDays} dias. Sua base está em dia.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Sem voltar há</TableHead>
                <TableHead className="text-right">Contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} className={isPending ? "opacity-70" : undefined}>
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
                                reactivationMessage(patient, clinicName),
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
                        <TooltipHint label="Tirar da lista de reativação">
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
    </>
  );
}
