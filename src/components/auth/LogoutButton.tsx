"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ label = "Sair e entrar com outra conta" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button className="w-full" variant="outline" disabled={isPending} onClick={handleLogout}>
      <LogOut className="size-4" />
      {isPending ? "Saindo..." : label}
    </Button>
  );
}
