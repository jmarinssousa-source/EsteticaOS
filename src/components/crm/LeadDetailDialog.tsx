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

  function handleSave() {
    startTransition(async () => {
      const result = await updateLead(lead.id, form);
      if ("error" in result) toast.error(result.error);
      else toast.success("Lead atualizado.");
    });
  }

  function handleMoveStage(stageId: string | null) {
    if (!stageId || stageId === lead.stage_id) return;
    startTransition(async () => {
      const result = await moveLeadToStage(lead.id, stageId);
      if ("error" in result) toast.error(result.error);
    });
  }

  function handleConvert() {
    startTransition(async () => {
      const result = await convertLeadToPatient(lead.id);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Lead convertido em paciente.");
        onOpenChange(false);
      }
    });
  }

  function handleMarkLost() {
    startTransition(async () => {
      const result = await markLeadLost(lead.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Lead marcado como perdido.");
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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
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
              <Input
                value={form.phone}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
              <Select value={lead.stage_id} onValueChange={handleMoveStage} disabled={!canEdit || !isOpenLead}>
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
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.potentialValue}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, potentialValue: e.target.value }))}
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

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                Salvar alterações
              </Button>
              {isOpenLead && (
                <>
                  <Button size="sm" variant="outline" onClick={handleConvert} disabled={isPending}>
                    Converter em paciente
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleMarkLost} disabled={isPending}>
                    Marcar como perdido
                  </Button>
                </>
              )}
            </div>
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
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
