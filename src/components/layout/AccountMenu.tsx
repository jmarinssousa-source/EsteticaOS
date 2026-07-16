"use client";

import { useTransition } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import { logout, requestOwnPasswordReset } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { ROLE_LABELS, type ClinicRole } from "@/lib/auth/permissions";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AccountMenu({
  fullName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: ClinicRole;
}) {
  const [isPending, startTransition] = useTransition();

  function handleResetPassword() {
    startTransition(async () => {
      const result = await requestOwnPasswordReset(email);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Enviamos um link para redefinir sua senha para ${email}.`);
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}>
        <Avatar className="size-8">
          <AvatarFallback>{initials(fullName) || "?"}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <OrbyniqBadge />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isPending} onClick={handleResetPassword}>
          <KeyRound className="size-4" />
          Redefinir senha
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isPending} onClick={handleLogout} variant="destructive">
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
