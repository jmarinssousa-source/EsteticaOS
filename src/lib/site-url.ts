import { headers } from "next/headers";

/**
 * Endereço público do sistema, num lugar só.
 *
 * Importa acertar porque daqui saem coisas que vão para fora e não dá
 * para corrigir depois de enviadas: o link de redefinir senha, o convite
 * de novo usuário e a prévia dos links compartilhados no WhatsApp.
 *
 * Ordem: a variável de ambiente manda. Sem ela, cai na URL que a Vercel
 * expõe (a de produção antes da de preview, senão um deploy de teste
 * mandaria e-mail apontando para si mesmo) e, por último, no localhost.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

/**
 * Mesma coisa, mas com o `Host` da requisição como rede de segurança —
 * para quando a variável não foi configurada e o sistema roda atrás de
 * um domínio que o build não conhecia.
 */
export async function resolveSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const host = (await headers()).get("host");
  if (host) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  return siteUrl();
}
