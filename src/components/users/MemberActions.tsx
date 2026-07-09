"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMemberPermissions, updateMemberRole, toggleMemberStatus } from "@/actions/users";
import {
  CLINIC_ROLES,
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  type ClinicRole,
  type Permissions,
} from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

export function MemberActions({
  userId,
  role,
  permissions,
  status,
}: {
  userId: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
  status: "active" | "inactive";
}) {
  const [isPending, startTransition] = useTransition();
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Permissions>>(permissions);

  function handleRoleChange(newRole: string | null) {
    if (!newRole) return;
    startTransition(async () => {
      const result = await updateMemberRole(userId, newRole);
      if (result?.error) toast.error(result.error);
      else toast.success("Perfil atualizado.");
    });
  }

  function handleStatusToggle() {
    const next = status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await toggleMemberStatus(userId, next);
      if (result?.error) toast.error(result.error);
      else toast.success(next === "active" ? "Usuário reativado." : "Usuário desativado.");
    });
  }

  function handleSavePermissions() {
    startTransition(async () => {
      const result = await updateMemberPermissions(userId, draft);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Permissões atualizadas.");
        setPermissionsOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={role} onValueChange={handleRoleChange} disabled={isPending}>
        <SelectTrigger className="h-8 w-40">
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

      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogTrigger
          render={<Button variant="outline" size="sm" onClick={() => setDraft(permissions)} />}
        >
          Permissões
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões</DialogTitle>
            <DialogDescription>
              Ajuste o que esta pessoa pode ver ou editar. Os valores começam no padrão do
              perfil ({ROLE_LABELS[role]}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="text-sm font-semibold">{group.label}</p>
                {group.keys.map((key) => {
                  const value = draft[key] ?? DEFAULT_PERMISSIONS[role][key];
                  return (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">
                        {PERMISSION_LABELS[key]}
                      </span>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setDraft((prev) => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDraft(DEFAULT_PERMISSIONS[role])}
              disabled={isPending}
            >
              Restaurar padrão do perfil
            </Button>
            <Button onClick={handleSavePermissions} disabled={isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant={status === "active" ? "outline" : "default"}
        size="sm"
        onClick={handleStatusToggle}
        disabled={isPending}
      >
        {status === "active" ? "Desativar" : "Reativar"}
      </Button>
    </div>
  );
}
