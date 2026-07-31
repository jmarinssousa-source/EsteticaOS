"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { CircleAlert, CircleCheck, Copy, Mail, UserPlus } from "lucide-react";
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

const initialState: InviteState = {};

/** O que a pessoa que acabou de ser convidada precisa fazer. */
function InviteOutcome({ state }: { state: InviteState }) {
  const email = state.invitedEmail;

  if (state.outcome === "existing") {
    return (
      <Alert>
        <CircleCheck className="size-4" />
        <AlertDescription>
          <p className="font-medium">Conta vinculada à clínica.</p>
          <p className="mt-1 text-sm">
            {email} já tinha conta no EstéticaOS. Nenhum e-mail foi enviado: a pessoa entra com a
            senha que já usa e a clínica passa a aparecer para ela.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.outcome === "link") {
    return (
      <Alert variant="destructive">
        <CircleAlert className="size-4" />
        <AlertDescription>
          <p className="font-medium">A conta foi criada, mas o e-mail não saiu.</p>
          <p className="mt-1 text-sm">{state.info}</p>
          <p className="mt-1 text-sm">
            Copie o link abaixo e mande para {email} por WhatsApp. Ele vale uma vez só.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Mail className="size-4" />
      <AlertDescription>
        <p className="font-medium">Convite enviado para {email}.</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Peça para a pessoa abrir o e-mail e clicar no link para criar a senha dela.</li>
          <li>
            <span className="font-medium">Se não chegar em alguns minutos</span>, peça para
            conferir a caixa de spam ou lixo eletrônico, e a aba Promoções no Gmail.
          </li>
          <li>
            O remetente é o EstéticaOS. Vale pedir para marcar como “não é spam” e adicionar aos
            contatos, para os próximos e-mails chegarem direto.
          </li>
          <li>O link do convite tem prazo. Se expirar, convide de novo por esta mesma tela.</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const [role, setRole] = useState<ClinicRole>("reception");

  // O resultado mostrado é guardado à parte do estado da action porque
  // `useActionState` não esquece a última resposta: sem isto, reabrir a
  // janela traria de volta a confirmação do convite anterior em vez do
  // formulário em branco.
  const [shown, setShown] = useState<InviteState>(initialState);
  const [prev, setPrev] = useState(state);
  if (state !== prev) {
    setPrev(state);
    setShown(state);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setShown(initialState);
      setRole("reception");
    }
  }

  const done = Boolean(shown.success);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="size-4" />
        Convidar usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{done ? "Usuário adicionado" : "Convidar usuário"}</DialogTitle>
          <DialogDescription>
            {done
              ? "A pessoa já faz parte da equipe. Falta ela conseguir entrar."
              : "Enviamos um e-mail para essa pessoa definir a própria senha e acessar a clínica."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <InviteOutcome state={shown} />

            {shown.inviteLink && (
              <div className="space-y-2">
                <Label>Link de acesso</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">
                    {shown.inviteLink}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Copiar link de acesso"
                    onClick={() => {
                      navigator.clipboard.writeText(shown.inviteLink ?? "");
                      toast.success("Link copiado.");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para os convites saírem por e-mail sozinhos, configure um servidor de envio
                  (SMTP) no Supabase.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {shown.error && (
              <Alert variant="destructive">
                <AlertDescription>{shown.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" name="fullName" required />
              {shown.fieldErrors?.fullName && (
                <p className="text-sm text-destructive">{shown.fieldErrors.fullName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
              <p className="text-xs text-muted-foreground">
                É para este endereço que vai o convite, então confira letra por letra.
              </p>
              {shown.fieldErrors?.email && (
                <p className="text-sm text-destructive">{shown.fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                name="role"
                value={role}
                onValueChange={(value) => value && setRole(value as ClinicRole)}
                items={CLINIC_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLINIC_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Uma clínica pode ter mais de um dono, mas dar esse
                  acesso não pode ser um clique distraído numa lista. */}
              {role === "owner" && (
                <p className="text-xs text-destructive">
                  Dono/Admin enxerga e edita tudo, inclusive financeiro e comissões, e pode
                  convidar, mudar perfil e remover qualquer pessoa da equipe, você inclusive.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profissão (opcional)</Label>
              <Input
                id="profession"
                name="profession"
                placeholder="Ex.: biomédica, fisioterapeuta, nutricionista"
              />
              <p className="text-xs text-muted-foreground">
                O perfil acima define o que a pessoa acessa; a profissão é só como ela aparece para
                a equipe e para o paciente.
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
