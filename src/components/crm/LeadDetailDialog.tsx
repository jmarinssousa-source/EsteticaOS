"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addLeadInteraction,
  convertLeadToPatient,
  getLeadInteractions,
  markLeadLost,
  moveLeadToStage,
  updateLead,
  type LeadInteraction,
} from "@/actions/crm";
import { LEAD_ORIGINS, LEAD_ORIGIN_LABELS, type LeadOrigin } from "@/lib/crm/constants";
import type { ClinicMemberOption, Lead, Stage } from "@/lib/crm/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function buildForm(lead: Lead) {
  return {
    name: lead.name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    origin: lead.origin,
    assignedTo: lead.assigned_to ?? "",
    nextAction: lead.next_action ?? "",
    followUpDate: lead.follow_up_date ?? "",
    potentialValue: lead.potential_value != null ? String(lead.potential_value) : "",
    notes: lead.notes ?? "",
  };
}

export function LeadDetailDialog({
  lead,
  stages,
  members,
  canEdit,
  open,
  onOpenChange,
}: {
  lead: Lead;
  stages: Stage[];
  members: ClinicMemberOption[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [note, setNote] = useState("");
  const [form, setForm] = useState(() => buildForm(lead));
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);

  // Reset the editable form whenever the dialog opens for a (possibly
  // different) lead. Derived during render — guarded by comparing against
  // the previous open/lead — instead of in an effect, to avoid an extra
  // render pass. See https://react.dev/learn/you-might-not-need-an-effect.
  const [syncedWith, setSyncedWith] = useState({ open, leadId: lead.id });
  if (open !== syncedWith.open || lead.id !== syncedWith.leadId) {
    setSyncedWith({ open, leadId: lead.id });
    if (open) setForm(buildForm(lead));
  }

  useEffect(() => {
    if (!open) return;
    getLeadInteractions(lead.id).then(setInteractions);
  }, [open, lead.id]);

  const isOpenLead = lead.status === "open";
  const assignee = members.find((m) => m.user_id === lead.assigned_to);
  // A coluna de fechamento existe? Sem ela o botão não teria para onde
  // mandar o lead, e é melhor não oferecer do que oferecer e falhar.
  const wonStage = stages.find((s) => s.role === "won");
  const lostStage = stages.find((s) => s.role === "lost");

  function handleSave() {
    startTransition(async () => {
      const result = await updateLead(lead.id, form);
      if ("error" in result) toast.error(result.error);
      else toast.success("Lead atualizado.");
    });
  }

  function handleMoveStage(stageId: string | null) {
    if (!stageId || stageId === lead.stage_id) return;

    // Mesma regra do quadro: mandar para a coluna de ganho vira paciente,
    // então confirma antes de criar o cadastro.
    const target = stages.find((s) => s.id === stageId);
    if (target?.role === "won" && lead.status !== "converted") {
      setPendingStage(target);
      return;
    }

    moveTo(stageId);
  }

  /**
   * Escolher a coluna de fechamento no seletor e clicar em "Converter em
   * paciente" acabam no mesmo lugar, porque são a mesma coisa dita de
   * dois jeitos. Quem decide qual coluna é a de fechamento é o servidor,
   * pelo papel dela — a tela só diz a intenção.
   */
  function confirmarConversao() {
    setPendingStage(null);
    convertNow();
  }

  function moveTo(stageId: string) {
    startTransition(async () => {
      const result = await moveLeadToStage(lead.id, stageId);
      if ("error" in result) toast.error(result.error);
    });
  }

  /**
   * O botão passa pela mesma confirmação do arrastar.
   *
   * Antes convertia no clique, sem perguntar — e converter cria um
   * cadastro de paciente de verdade. Quem clicasse por engano só
   * descobria depois, com o paciente já na lista.
   */
  function handleConvert() {
    if (!wonStage) return;
    setPendingStage(wonStage);
  }

  function convertNow() {
    startTransition(async () => {
      const result = await convertLeadToPatient(lead.id);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(`${lead.name} agora é paciente da clínica.`);
        onOpenChange(false);
      }
    });
  }

  function handleMarkLost() {
    startTransition(async () => {
      const result = await markLeadLost(lead.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`${lead.name} foi para a coluna de perdidos.`);
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      const result = await addLeadInteraction(lead.id, note);
      if ("error" in result) toast.error(result.error);
      else {
        setNote("");
        getLeadInteractions(lead.id).then(setInteractions);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{lead.name}</DialogTitle>
            {lead.status === "converted" && <Badge>Convertido em paciente</Badge>}
            {lead.status === "lost" && <Badge variant="outline">Perdido</Badge>}
          </div>
          <DialogDescription>
            Criado em {formatDateTime(lead.created_at)}
            {assignee ? ` · Responsável: ${assignee.full_name}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                items={LEAD_ORIGINS.map((origin) => ({
                  value: origin,
                  label: LEAD_ORIGIN_LABELS[origin as LeadOrigin],
                }))}
                value={form.origin}
                onValueChange={(v) => v && setForm((f) => ({ ...f, origin: v as LeadOrigin }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_ORIGINS.map((origin) => (
                    <SelectItem key={origin} value={origin}>
                      {LEAD_ORIGIN_LABELS[origin as LeadOrigin]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <MaskedInput
                mask="phone"
                value={form.phone}
                disabled={!canEdit}
                onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                items={[
                  { value: "none", label: "Sem responsável" },
                  ...members.map((member) => ({ value: member.user_id, label: member.full_name })),
                ]}
                value={form.assignedTo || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v === "none" ? "" : (v ?? "") }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coluna</Label>
              <Select
                items={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
                value={lead.stage_id}
                onValueChange={handleMoveStage}
                // Só a permissão manda. Antes um lead perdido ficava
                // travado aqui, embora arrastar o mesmo card de volta
                // para uma coluna comum o reabrisse sem reclamar — as
                // duas formas de mover precisam permitir a mesma coisa.
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de follow-up</Label>
              <Input
                type="date"
                value={form.followUpDate}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor potencial (R$)</Label>
              <CurrencyInput
                value={form.potentialValue}
                disabled={!canEdit}
                onValueChange={(potentialValue) => setForm((f) => ({ ...f, potentialValue }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Próxima ação</Label>
            <Input
              value={form.nextAction}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={form.notes}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {form.potentialValue && (
            <p className="text-xs text-muted-foreground">
              Valor potencial: {formatCurrency(Number(form.potentialValue))}
            </p>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Histórico de interações</Label>
            {canEdit && (
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  placeholder="Registrar uma interação (ligação, mensagem, visita...)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button size="sm" onClick={handleAddNote} disabled={isPending || !note.trim()}>
                  Adicionar
                </Button>
              </div>
            )}
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {interactions.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
              )}
              {interactions.map((interaction) => {
                const author = members.find((m) => m.user_id === interaction.author_id);
                return (
                  <div key={interaction.id} className="rounded-md border p-2 text-sm">
                    <p>{interaction.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {author?.full_name ?? "Usuário"} · {formatDateTime(interaction.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {canEdit && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSave} disabled={isPending}>
                  Salvar alterações
                </Button>
                {isOpenLead && (
                  <>
                    {/* Botão escondido quando não há coluna com o papel:
                        oferecer uma ação que só pode terminar em recado de
                        erro é pior do que não oferecer. */}
                    {wonStage && (
                      <Button size="sm" variant="outline" onClick={handleConvert} disabled={isPending}>
                        Converter em paciente
                      </Button>
                    )}
                    {lostStage && (
                      <Button size="sm" variant="outline" onClick={handleMarkLost} disabled={isPending}>
                        Marcar como perdido
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter />
      </DialogContent>

      <AlertDialog open={pendingStage !== null} onOpenChange={(o) => !o && setPendingStage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter {lead.name} em paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              O lead vai para a coluna &quot;{pendingStage?.name}&quot; e um cadastro de paciente
              será criado com os dados dele, liberando agenda, prontuário e financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarConversao}>Converter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
