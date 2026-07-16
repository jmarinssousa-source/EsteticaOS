"use client";

import { useActionState } from "react";
import { updateClinic } from "@/actions/clinic";
import type { ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ActionState = {};

export function ClinicForm({
  clinic,
  readOnly,
}: {
  clinic: {
    name: string;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    stale_lead_days: number;
  };
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateClinic, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Dados da clínica atualizados.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da clínica</Label>
        <Input id="name" name="name" defaultValue={clinic.name} disabled={readOnly} required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <MaskedInput
          mask="cnpj"
          id="cnpj"
          name="cnpj"
          placeholder="00.000.000/0000-00"
          defaultValue={clinic.cnpj ?? ""}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <MaskedInput
          mask="phone"
          id="phone"
          name="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={clinic.phone ?? ""}
          disabled={readOnly}
          required
        />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={clinic.email ?? ""}
          disabled={readOnly}
          required
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" defaultValue={clinic.address ?? ""} disabled={readOnly} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="staleLeadDays">Considerar lead parado após quantos dias sem movimentação</Label>
        <Input
          id="staleLeadDays"
          name="staleLeadDays"
          type="number"
          min="1"
          defaultValue={clinic.stale_lead_days}
          disabled={readOnly}
          required
        />
        {state.fieldErrors?.staleLeadDays && (
          <p className="text-sm text-destructive">{state.fieldErrors.staleLeadDays[0]}</p>
        )}
      </div>

      {!readOnly && (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      )}
    </form>
  );
}
