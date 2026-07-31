"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Recolhe a sessão que chega no fragmento da URL.
 *
 * O `/auth/v1/verify` do Supabase, quando o token do e-mail não é PKCE
 * (é o caso de convite e de recuperação gerados pelo servidor), devolve
 * a sessão depois do `#`, assim:
 *
 *     https://esteticaos.com/#access_token=...&refresh_token=...&type=invite
 *
 * O navegador nunca manda o que vem depois do `#` para o servidor. Ou
 * seja: rota de servidor nenhuma enxerga isso, e o convidado fica
 * olhando a landing com a sessão dele pendurada na barra de endereço,
 * sem nada acontecer. Era exatamente o sintoma relatado.
 *
 * Este componente lê o fragmento no navegador, grava a sessão nos
 * cookies (o cliente do `@supabase/ssr` grava no formato que o servidor
 * lê) e leva a pessoa para onde ela deveria ter ido. Fica montado na
 * landing e nas telas de autenticação, que são os dois lugares onde o
 * Supabase pode largar alguém.
 *
 * Não aparece na tela: enquanto trabalha, a página por baixo continua
 * sendo a que já estava lá.
 */
export function AuthHashCatcher() {
  const router = useRouter();
  // Ref, e não estado: isto só existe para o efeito não rodar duas vezes
  // (o modo estrito monta tudo em dobro no desenvolvimento) e nada na
  // tela depende do valor.
  const jaProcessou = useRef(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || jaProcessou.current) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const erro = params.get("error_code") ?? params.get("error");

    if (!accessToken && !erro) return;

    jaProcessou.current = true;
    // A URL é limpa antes de qualquer navegação: token na barra de
    // endereço vira histórico do navegador e link compartilhado.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (erro || !accessToken || !refreshToken) {
      router.replace("/login?error=link-invalido");
      return;
    }

    const tipo = params.get("type");
    // Convite e recuperação existem para a pessoa criar uma senha; sem
    // isso ela entra uma vez e nunca mais consegue voltar sozinha.
    const destino = tipo === "invite" || tipo === "recovery" ? "/redefinir-senha" : "/hoje";

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        router.replace(error ? "/login?error=link-invalido" : destino);
        router.refresh();
      });
  }, [router]);

  return null;
}
