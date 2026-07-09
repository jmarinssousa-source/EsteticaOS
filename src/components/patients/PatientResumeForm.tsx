"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePatient } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PatientResumeForm({
  patientId,
  patient,
  canEdit,
}: {
  patientId: string;
  patient: {
    name: string;
    phone: string | null;
    email: string | null;
    cpf: string | null;
    birth_date: string | null;
    gender: string | null;
    address: string | null;
    notes: string | null;
  };
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: patient.name,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    cpf: patient.cpf ?? "",
    birthDate: patient.birth_date ?? "",
    gender: patient.gender ?? "",
    address: patient.address ?? "",
    notes: patient.notes ?? "",
  });

  function handleSave() {
    startTransition(async () => {
      const result = await updatePatient(patientId, form);
      if ("error" in result) toast.error(result.error);
      else toast.success("Paciente atualizado.");
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
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
          <Label>Telefone</Label>
          <Input
            value={form.phone}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            value={form.email}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>CPF</Label>
          <Input
            value={form.cpf}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de nascimento</Label>
          <Input
            type="date"
            value={form.birthDate}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Gênero</Label>
          <Input
            value={form.gender}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          value={form.address}
          disabled={!canEdit}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={3}
          value={form.notes}
          disabled={!canEdit}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {canEdit && (
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      )}
    </div>
  );
}
