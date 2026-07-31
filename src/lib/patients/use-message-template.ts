"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * Lê e grava um modelo de mensagem guardado no navegador.
 *
 * O texto vive no localStorage, que o servidor não enxerga. Ler por
 * `useSyncExternalStore` mantém o HTML do servidor e o do cliente iguais
 * na primeira pintura e troca depois da hidratação, em vez de acusar
 * diferença de conteúdo.
 */
export function useMessageTemplate(storageKey: string, fallback: string) {
  const stored = useSyncExternalStore(
    subscribe,
    useCallback(() => window.localStorage.getItem(storageKey), [storageKey]),
    () => null,
  );
  // O valor recém-salvo fica aqui porque `useSyncExternalStore` sem
  // inscrição de verdade não relê o localStorage sozinho.
  const [override, setOverride] = useState<string | null>(null);
  const template = override ?? stored ?? fallback;

  const save = useCallback(
    (draft: string) => {
      // Campo esvaziado volta ao texto original em vez de virar uma
      // mensagem em branco no WhatsApp.
      const value = draft.trim() || fallback;
      window.localStorage.setItem(storageKey, value);
      setOverride(value);
      return value;
    },
    [storageKey, fallback],
  );

  return { template, save };
}
