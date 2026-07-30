"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteMember, updateMemberPermissions, toggleMemberStatus } from "@/actions/users";
import {
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  type ClinicRole,
  type Permissions,
} from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MemberActions({
  userId,
  name,
  role,
  permissions,
  status,
}: {
  userId: string;
  name: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
  status: "active" | "inactive";
}) {
  const [isPending, startTransition] = useTransition();
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Permissions>>(permissions);

  function handleStatusToggle() {
    const next = status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await toggleMemberStatus(userId, next);
      if (result?.error) toast.error(result.error);
      else toast.success(next === "active" ? "Usuário reativado." : "Usuário desativado.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMember(userId);
      if (result?.error) toast.error(result.error);
      else toast.success("Usuário removido da clínica.");
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
    <div className="flex items-center justify-end gap-2">
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogTrigger
          render={<Button variant="outline" size="sm" onClick={() => setDraft(permissions)} />}
        >
          Permissões
        </DialogTrigger>
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto">
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

      <AlertDialog>
        <TooltipHint label={`Remover ${name} da clínica`}>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${name} da clínica`}
              />
            }
          >
            <Trash2 className="size-4" />
          </AlertDialogTrigger>
        </TooltipHint>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {name} da clínica?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa perde o acesso na hora e sai desta lista. Os atendimentos e agendamentos
              que ela fez continuam no sistema, mas deixam de mostrar o nome dela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Se ela saiu da clínica mas você quer manter o histórico com o nome, use
            &quot;Desativar&quot; — o acesso é bloqueado do mesmo jeito.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
