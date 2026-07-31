"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMemberRole } from "@/actions/users";
import { CLINIC_ROLES, ROLE_LABELS, type ClinicRole } from "@/lib/auth/permissions";
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

/**
 * Perfil de acesso, editável na própria coluna Perfil.
 *
 * Dono/Admin entra na lista porque clínica com dois sócios precisa de
 * dois donos. Promover alguém dá acesso a tudo, inclusive a convidar e
 * remover gente, então essa escolha passa por uma confirmação escrita;
 * as outras são aplicadas direto.
 *
 * O próprio perfil não é editável aqui: quem é dono só poderia se
 * rebaixar, e sem outro dono por perto não haveria caminho de volta. O
 * servidor recusa de novo, para a regra não depender da tela.
 */
export function MemberRoleSelect({
  userId,
  name,
  role,
  canEdit,
  isSelf = false,
}: {
  userId: string;
  /** Nome de quem vai mudar de perfil, para a confirmação ser específica. */
  name: string;
  role: ClinicRole;
  canEdit: boolean;
  isSelf?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingPromotion, setPendingPromotion] = useState(false);

  if (!canEdit || isSelf) {
    return <span className="text-sm">{ROLE_LABELS[role]}</span>;
  }

  function apply(newRole: ClinicRole) {
    startTransition(async () => {
      const result = await updateMemberRole(userId, newRole);
      if (result?.error) toast.error(result.error);
      else toast.success(`${name} agora é ${ROLE_LABELS[newRole]}.`);
    });
  }

  function handleChange(newRole: string | null) {
    if (!newRole || newRole === role) return;
    if (newRole === "owner") {
      setPendingPromotion(true);
      return;
    }
    apply(newRole as ClinicRole);
  }

  return (
    <>
      <Select
        items={CLINIC_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        value={role}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 w-44">
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

      <AlertDialog open={pendingPromotion} onOpenChange={setPendingPromotion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar {name} Dono/Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Dono/Admin enxerga e edita tudo na clínica, inclusive o financeiro e as comissões, e
              pode convidar, mudar o perfil e remover qualquer pessoa da equipe, você inclusive.
              <br />
              <br />
              Uma clínica pode ter mais de um Dono/Admin. Você continua com o seu acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingPromotion(false);
                apply("owner");
              }}
            >
              Tornar Dono/Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
