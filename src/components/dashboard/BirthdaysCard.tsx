"use client";

import { useState } from "react";
import Link from "next/link";
import { Cake, MessageCircle, Pencil } from "lucide-react";
import type { Birthday } from "@/lib/patients/birthdays";
import {
  BIRTHDAY_TEMPLATE_KEY,
  DEFAULT_BIRTHDAY_MESSAGE,
  renderPatientMessage,
} from "@/lib/patients/messages";
import { useMessageTemplate } from "@/lib/patients/use-message-template";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { StatCardBody } from "@/components/dashboard/StatCard";
import { MessageTemplateEditor } from "@/components/patients/MessageTemplateEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Aniversariantes do dia como mais um quadradinho da grade do Hoje.
 *
 * Antes isto era um painel largo no topo da página, que empurrava os
 * indicadores para baixo todo dia em que alguém fazia aniversário. Agora
 * ocupa o mesmo espaço dos vizinhos e a lista abre em uma janela: manda a
 * mensagem e volta para o Hoje sem trocar de tela.
 */
export function BirthdaysCard({
  birthdays,
  clinicName,
}: {
  birthdays: Birthday[];
  clinicName: string;
}) {
  const { template, save } = useMessageTemplate(BIRTHDAY_TEMPLATE_KEY, DEFAULT_BIRTHDAY_MESSAGE);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_BIRTHDAY_MESSAGE);

  // Nome de exemplo da prévia: o primeiro da lista quando há alguém, e um
  // nome qualquer quando a lista está vazia (dá para ajustar o texto com
  // antecedência, em um dia sem aniversariante).
  const previewName = birthdays[0]?.name ?? "Maria";

  function openList() {
    setEditing(false);
    setOpen(true);
  }

  function openEditor() {
    setDraft(template);
    setEditing(true);
  }

  return (
    <>
      <button type="button" onClick={openList} className="rounded-xl text-left">
        <StatCardBody
          title="Aniversariantes de hoje"
          value={String(birthdays.length)}
          icon={Cake}
          emphasis={birthdays.length > 0}
          subtitle={birthdays.length > 0 ? "Abrir e parabenizar" : undefined}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {editing ? (
            <MessageTemplateEditor
              title="Mensagem de aniversário"
              draft={draft}
              onDraftChange={setDraft}
              defaultMessage={DEFAULT_BIRTHDAY_MESSAGE}
              previewName={previewName}
              clinicName={clinicName}
              onCancel={() => setEditing(false)}
              onSave={() => {
                save(draft);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {birthdays.length === 1
                    ? "1 aniversariante hoje"
                    : `${birthdays.length} aniversariantes hoje`}
                </DialogTitle>
                <DialogDescription>
                  {birthdays.length > 0
                    ? "A mensagem já vai pronta no WhatsApp, dá para revisar antes de enviar."
                    : "Ninguém da sua base faz aniversário hoje."}
                </DialogDescription>
              </DialogHeader>

              {birthdays.length > 0 && (
                <div className="space-y-2">
                  {birthdays.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="font-medium hover:underline"
                        >
                          {patient.name}
                        </Link>
                        {patient.age !== null && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            faz {patient.age} anos
                          </span>
                        )}
                      </div>
                      {patient.phone ? (
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
                              // Enviada a mensagem, a janela fecha e a
                              // pessoa volta para o Hoje: o WhatsApp abre
                              // em outra aba, não há por que manter a
                              // lista aberta por baixo.
                              onClick={() => setOpen(false)}
                            />
                          }
                        >
                          <MessageCircle className="size-4" />
                          Parabenizar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem telefone cadastrado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={openEditor}>
                  <Pencil className="size-4" />
                  Editar mensagem
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
