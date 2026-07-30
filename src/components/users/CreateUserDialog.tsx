"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";
import { createUser, type InviteState } from "@/actions/users";
import { CLINIC_ROLES, ROLE_LABELS, type ClinicRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ASSIGNABLE_ROLES = CLINIC_ROLES.filter((role) => role !== "owner") as Exclude<
  ClinicRole,
  "owner"
>[];

const initialState: InviteState = {};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initialState);

  // Fecha sozinho quando o convite saiu por e-mail. Se o e-mail falhou,
  // a janela fica aberta mostrando o link — mas em tela própria, não com
  // o formulário repetido embaixo.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success && !state.inviteLink) setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Ao reabrir, volta para o formulário em vez do link antigo.
    if (!next) setPrevState(initialState);
  }

  const showLink = Boolean(state.success && state.inviteLink);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="size-4" />
        Convidar usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showLink ? "Usuário cadastrado" : "Convidar usuário"}</DialogTitle>
          <DialogDescription>
            {showLink
              ? "A conta já existe na clínica. Falta a pessoa definir a senha pelo link abaixo."
              : "Enviaremos um e-mail para essa pessoa definir a própria senha e acessar a clínica."}
          </DialogDescription>
        </DialogHeader>

        {showLink ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>{state.info}</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Link de acesso</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">
                  {state.inviteLink}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(state.inviteLink ?? "");
                    toast.success("Link copiado.");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O link vale uma vez só. Para os convites saírem por e-mail sozinhos, configure um
                servidor de envio (SMTP) no Supabase.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" name="fullName" required />
            {state.fieldErrors?.fullName && (
              <p className="text-sm text-destructive">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
            {state.fieldErrors?.email && (
              <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <Select
              name="role"
              defaultValue="reception"
              items={ASSIGNABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession">Profissão (opcional)</Label>
            <Input
              id="profession"
              name="profession"
              placeholder="Ex.: biomédica, fisioterapeuta, nutricionista"
            />
            <p className="text-xs text-muted-foreground">
              O perfil acima define o que a pessoa acessa; a profissão é só como ela aparece para a
              equipe e para o paciente.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando convite..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
