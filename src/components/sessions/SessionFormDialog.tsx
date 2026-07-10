"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createSession } from "@/actions/sessions";
import type { ActionState } from "@/actions/auth";
import type { PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import type { PackageBalanceOption } from "@/lib/sessions/types";
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

export function SessionFormDialog({
  patients,
  professionals,
  procedures,
  packageBalances,
  fixedPatientId,
}: {
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  packageBalances: (PackageBalanceOption & { patient_id: string })[];
  fixedPatientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState(fixedPatientId ?? "");
  const [packageBalanceId, setPackageBalanceId] = useState("");
  const [state, formAction, pending] = useActionState(createSession, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  const availableBalances = useMemo(
    () => packageBalances.filter((b) => b.patient_id === patientId),
    [packageBalances, patientId],
  );

  const selectedBalance = availableBalances.find((b) => b.id === packageBalanceId);
  const noBalanceLeft = selectedBalance && selectedBalance.used_sessions >= selectedBalance.total_sessions;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Nova sessão
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova sessão</DialogTitle>
          <DialogDescription>Registre uma sessão avulsa ou vinculada a um pacote.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="status" value="scheduled" />
          <input type="hidden" name="packageBalanceId" value={packageBalanceId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {!fixedPatientId && (
            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente</Label>
              <Select
                name="patientId"
                items={patients.map((patient) => ({ value: patient.id, label: patient.name }))}
                value={patientId}
                onValueChange={(v) => {
                  setPatientId(v ?? "");
                  setPackageBalanceId("");
                }}
              >
                <SelectTrigger id="patientId" className="w-full">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.patientId && (
                <p className="text-sm text-destructive">{state.fieldErrors.patientId[0]}</p>
              )}
            </div>
          )}
          {fixedPatientId && <input type="hidden" name="patientId" value={fixedPatientId} />}

          <div className="space-y-2">
            <Label htmlFor="procedureId">Procedimento</Label>
            <Select
              name="procedureId"
              defaultValue=""
              items={procedures.map((procedure) => ({ value: procedure.id, label: procedure.name }))}
            >
              <SelectTrigger id="procedureId" className="w-full">
                <SelectValue placeholder="Sem procedimento definido" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pacote</Label>
            <Select
              items={[
                { value: "none", label: "Sessão avulsa (sem pacote)" },
                ...availableBalances.map((balance) => ({
                  value: balance.id,
                  label: `${balance.package_name} (${balance.total_sessions - balance.used_sessions} restantes)`,
                })),
              ]}
              value={packageBalanceId || "none"}
              onValueChange={(v) => setPackageBalanceId(v === "none" ? "" : (v ?? ""))}
              disabled={!patientId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={patientId ? "Sessão avulsa" : "Selecione o paciente primeiro"} />
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
            {noBalanceLeft && (
              <p className="text-sm text-amber-600">
                Este pacote não tem saldo de sessões, mas você ainda pode lançar a sessão.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalId">Profissional</Label>
            <Select
              name="professionalId"
              defaultValue=""
              items={professionals.map((professional) => ({
                value: professional.user_id,
                label: professional.full_name,
              }))}
            >
              <SelectTrigger id="professionalId" className="w-full">
                <SelectValue placeholder="Sem profissional definido" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((professional) => (
                  <SelectItem key={professional.user_id} value={professional.user_id}>
                    {professional.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionDate">Data</Label>
            <Input
              id="sessionDate"
              name="sessionDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !patientId}>
              {pending ? "Criando..." : "Criar sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
