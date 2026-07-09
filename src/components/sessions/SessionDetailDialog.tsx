"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { signSession, updateSession } from "@/actions/sessions";
import { SESSION_STATUSES, SESSION_STATUS_LABELS } from "@/lib/sessions/constants";
import type { Session, PackageBalanceOption } from "@/lib/sessions/types";
import type { PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SignaturePad } from "@/components/signature/SignaturePad";
import { SignatureDisplay } from "@/components/signature/SignatureDisplay";

function buildForm(session: Session) {
  return {
    patientId: session.patient_id,
    professionalId: session.professional_id ?? "",
    procedureId: session.procedure_id ?? "",
    packageBalanceId: session.package_balance_id ?? "",
    sessionDate: session.session_date,
    status: session.status,
    notes: session.notes ?? "",
  };
}

export function SessionDetailDialog({
  session,
  patients,
  professionals,
  procedures,
  packageBalances,
  canEdit,
  open,
  onOpenChange,
}: {
  session: Session;
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  packageBalances: (PackageBalanceOption & { patient_id: string })[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(() => buildForm(session));

  const [syncedWith, setSyncedWith] = useState({ open, id: session.id });
  if (open !== syncedWith.open || session.id !== syncedWith.id) {
    setSyncedWith({ open, id: session.id });
    if (open) setForm(buildForm(session));
  }

  const availableBalances = useMemo(
    () => packageBalances.filter((b) => b.patient_id === form.patientId),
    [packageBalances, form.patientId],
  );

  const patient = patients.find((p) => p.id === session.patient_id);

  function handleSave() {
    startTransition(async () => {
      const result = await updateSession(session.id, session.patient_id, form);
      if ("error" in result) toast.error(result.error);
      else toast.success("Sessão atualizada.");
    });
  }

  function handleSign(role: "patient" | "professional", dataUrl: string) {
    startTransition(async () => {
      const result = await signSession(session.id, session.patient_id, role, dataUrl);
      if ("error" in result) toast.error(result.error);
      else toast.success("Assinatura salva.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient?.name ?? "Sessão"}</DialogTitle>
          <DialogDescription>Edite a sessão, mude o status ou colete as assinaturas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select
                value={form.procedureId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, procedureId: v === "none" ? "" : (v ?? "") }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem procedimento</SelectItem>
                  {procedures.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                value={form.professionalId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, professionalId: v === "none" ? "" : (v ?? "") }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem profissional</SelectItem>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.user_id} value={professional.user_id}>
                      {professional.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pacote</Label>
            <Select
              value={form.packageBalanceId || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, packageBalanceId: v === "none" ? "" : (v ?? "") }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sessão avulsa (sem pacote)</SelectItem>
                {availableBalances.map((balance) => (
                  <SelectItem key={balance.id} value={balance.id}>
                    {balance.package_name} ({balance.total_sessions - balance.used_sessions} restantes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.sessionDate}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as typeof form.status }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {SESSION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              Salvar alterações
            </Button>
          )}

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assinatura do paciente</Label>
              {session.patient_signature ? (
                <SignatureDisplay dataUrl={session.patient_signature} label="Assinado" />
              ) : canEdit ? (
                <SignaturePad saving={isPending} onSave={(dataUrl) => handleSign("patient", dataUrl)} />
              ) : (
                <p className="text-sm text-muted-foreground">Ainda não assinado.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assinatura do profissional</Label>
              {session.professional_signature ? (
                <SignatureDisplay dataUrl={session.professional_signature} label="Assinado" />
              ) : canEdit ? (
                <SignaturePad saving={isPending} onSave={(dataUrl) => handleSign("professional", dataUrl)} />
              ) : (
                <p className="text-sm text-muted-foreground">Ainda não assinado.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
