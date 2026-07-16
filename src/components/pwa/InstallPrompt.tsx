"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "esteticaos:install-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function subscribeNever() {
  return () => {};
}

type Visibility = "hidden" | "ios-hint" | "none";

function getVisibilitySnapshot(): Visibility {
  if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "true") return "hidden";
  if (isIos()) return "ios-hint";
  return "none";
}

function getServerVisibilitySnapshot(): Visibility {
  return "hidden";
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedManually, setDismissedManually] = useState(false);
  const visibility = useSyncExternalStore(subscribeNever, getVisibilitySnapshot, getServerVisibilitySnapshot);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissedManually(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissedManually || visibility === "hidden") return null;
  if (!deferredPrompt && visibility !== "ios-hint") return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl sm:inset-x-auto sm:right-4">
      <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instalar EstéticaOS</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {deferredPrompt
            ? "Acesse rapidamente como um app, direto da tela inicial."
            : 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'}
        </p>
        {deferredPrompt && (
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={install}>
              <Download className="size-3.5" />
              Instalar
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Agora não
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
