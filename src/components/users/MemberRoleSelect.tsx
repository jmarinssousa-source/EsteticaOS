"use client";

import { useTransition } from "react";
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

const ASSIGNABLE_ROLES = CLINIC_ROLES.filter((role) => role !== "owner") as Exclude<
  ClinicRole,
  "owner"
>[];

/** Perfil de acesso, editável na própria coluna Perfil — antes ele
 *  aparecia duas vezes: como etiqueta aqui e como lista em Ações. */
export function MemberRoleSelect({
  userId,
  role,
  canEdit,
}: {
  userId: string;
  role: ClinicRole;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (!canEdit || role === "owner") {
    return <span className="text-sm">{ROLE_LABELS[role]}</span>;
  }

  function handleChange(newRole: string | null) {
    if (!newRole) return;
    startTransition(async () => {
      const result = await updateMemberRole(userId, newRole);
      if (result?.error) toast.error(result.error);
      else toast.success("Perfil atualizado.");
    });
  }

  return (
    <Select
      items={ASSIGNABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
      value={role}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
