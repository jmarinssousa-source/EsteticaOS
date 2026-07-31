"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipHint } from "@/components/ui/tooltip-hint";

function subscribe() {
  return () => {};
}

/**
 * `className` existe para a página de vendas, onde o alvo precisa dos
 * 44px do dedo. No painel o padrão compacto continua valendo.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Forces a re-render once hydration completes, without setState-in-effect:
  // the server snapshot is always false, the client snapshot always true.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" className={className} aria-label="Alternar tema" disabled>
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Mudar para tema claro" : "Mudar para tema escuro";

  return (
    <TooltipHint label={label}>
      <Button
        variant="ghost"
        size="icon-sm"
        className={className}
        aria-label={label}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </TooltipHint>
  );
}
