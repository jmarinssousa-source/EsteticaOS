"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { logout, requestOwnPasswordReset } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORT_WHATSAPP_LABEL, SUPPORT_WHATSAPP_URL } from "@/components/layout/OrbyniqBadge";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleResetPassword() {
    startTransition(async () => {
      const result = await requestOwnPasswordReset(email);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.info) {
        toast.info(result.info);
      } else {
        toast.success(`Enviamos um link para redefinir sua senha para ${email}.`);
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <TooltipHint label="Sua conta: trocar senha, suporte e sair">
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}
        >
          <Avatar className="size-8">
            <AvatarFallback>{initials(fullName) || "?"}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
        </DropdownMenuTrigger>
      </TooltipHint>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{fullName}</span>
              <span className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />
            }
          >
            <MessageCircle className="size-4" />
            <span className="flex flex-col">
              Suporte via WhatsApp
              <span className="text-xs font-normal text-muted-foreground">
                {SUPPORT_WHATSAPP_LABEL}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onClick={handleResetPassword}>
            <KeyRound className="size-4" />
            Redefinir senha
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onClick={handleLogout} variant="destructive">
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Uma solução Orbyniq
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
