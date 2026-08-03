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
 * Endereços que o `Host` da requisição pode assumir sem levantar suspeita.
 *
 * Só entram os que o próprio ambiente declarou: o localhost do
 * desenvolvimento e os domínios que a Vercel expõe para este projeto.
 */
function hostConhecido(host: string): boolean {
  const nome = host.toLowerCase().split(":")[0];

  if (nome === "localhost" || nome === "127.0.0.1" || nome === "[::1]") return true;

  const daVercel = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]
    .filter(Boolean)
    .map((valor) => valor!.toLowerCase().split(":")[0]);

  return daVercel.includes(nome);
}

/**
 * Mesma coisa, mas com o `Host` da requisição como rede de segurança —
 * para quando a variável não foi configurada e o sistema roda atrás de
 * um domínio que o build não conhecia.
 *
 * ## Por que o `Host` é conferido
 *
 * Daqui saem os endereços dos links de convite e de redefinição de senha.
 * O `Host` é escrito pelo cliente: quem manda a requisição escolhe o
 * valor. Sem conferência, um pedido de "esqueci minha senha" com
 * `Host: servidor-do-atacante` faria o link do e-mail — que dá acesso à
 * conta — apontar para o servidor do atacante. É o ataque conhecido como
 * envenenamento de redefinição de senha.
 *
 * Na prática o Supabase ainda barraria o destino pela lista de Redirect
 * URLs do projeto, mas essa lista é configuração externa, mora fora do
 * repositório e já precisou de curinga para o convite funcionar. Não é
 * lugar de apoiar a única defesa.
 *
 * Por isso o `Host` só vale quando é um endereço que o próprio ambiente
 * declarou. Fora disso, cai no endereço de build — errado, talvez, mas
 * nunca no endereço de outra pessoa.
 */
export async function resolveSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const host = (await headers()).get("host");
  if (host && hostConhecido(host)) {
    return `${host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"}://${host}`;
  }

  return siteUrl();
}
