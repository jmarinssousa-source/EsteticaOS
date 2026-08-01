/**
 * Domínio oficial do sistema, para o proxy.
 *
 * Fica separado de `site-url.ts` de propósito: aquele arquivo importa
 * `next/headers`, que não existe no proxy. Aqui só entra função pura.
 *
 * ## Por que isto existe
 *
 * O endereço do link que chega no e-mail **não é escolhido pelo nosso
 * código**. Quem monta é o Supabase, a partir da *Site URL* do projeto
 * (nos templates com `{{ .SiteURL }}`) ou da lista de Redirect URLs
 * (quando o link passa por `/auth/v1/verify`). Se qualquer uma das duas
 * ainda apontar para um endereço antigo, o convite chega apontando para
 * lá — e não há nada no repositório que impeça isso.
 *
 * O que dá para fazer é não deixar isso quebrar o fluxo: qualquer
 * requisição que chegue por um endereço que não seja o oficial é
 * devolvida para o oficial, com caminho e query intactos. O token do
 * e-mail viaja junto e a sessão é gravada no cookie do domínio certo.
 * O fragmento (`#access_token=...`), que o servidor nem enxerga, é
 * levado pelo próprio navegador quando o destino do redirect não tem
 * fragmento próprio.
 *
 * Sem isto, um link antigo grava a sessão no cookie do endereço antigo:
 * a pessoa até define a senha, mas volta ao domínio oficial deslogada.
 */

/**
 * Marca de "já redirecionei esta pessoa uma vez".
 *
 * Existe por causa de um laço possível e caríssimo. A Vercel também sabe
 * redirecionar domínio, no painel, antes da requisição chegar aqui. Se
 * alguém configurar lá o caminho contrário — o domínio oficial apontando
 * para o endereço interno da Vercel — os dois passam a empurrar a
 * requisição um para o outro e o sistema inteiro sai do ar em laço de
 * redirecionamento.
 *
 * O cookie corta isso no segundo salto: quem já foi redirecionado uma
 * vez passa direto. O site fica no endereço errado, que é ruim, mas
 * continua de pé — e o log conta o que aconteceu.
 *
 * Dura poucos segundos de propósito: é para atravessar um redirect, não
 * para virar estado.
 */
export const CANONICAL_GUARD_COOKIE = "eos_canon";

/** Endereços que nunca devem ser redirecionados para o domínio oficial. */
function isLocalHost(host: string): boolean {
  const name = host.split(":")[0];
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]" || name.endsWith(".local");
}

/**
 * Para onde redirecionar, ou `null` quando já está no lugar certo.
 *
 * Devolve `null` — ou seja, não mexe em nada — quando:
 *
 * - `NEXT_PUBLIC_SITE_URL` não está configurada. Sem domínio oficial
 *   declarado não há para onde canonizar, e adivinhar a partir das
 *   variáveis da Vercel arriscaria um laço de redirecionamento.
 * - O deploy é de *preview*. Cada PR tem endereço próprio e precisa
 *   continuar navegável; mandar o preview para produção tornaria
 *   impossível testar qualquer coisa antes do merge.
 * - A requisição já chegou no domínio oficial, ou veio de `localhost`.
 */
export function canonicalRedirect(
  url: URL,
  host: string | null,
): URL | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;
  if (process.env.VERCEL_ENV === "preview") return null;
  if (!host || isLocalHost(host)) return null;

  let oficial: URL;
  try {
    oficial = new URL(configured);
  } catch {
    return null;
  }

  if (isLocalHost(oficial.host)) return null;
  if (host.toLowerCase() === oficial.host.toLowerCase()) return null;

  const destino = new URL(url.toString());
  destino.protocol = oficial.protocol;
  // `hostname` e `port` separados, não `host`: o setter de `host` só
  // troca a porta quando o valor traz uma, então `esteticaos.com`
  // aplicado sobre `localhost:3000` viraria `esteticaos.com:3000`.
  destino.hostname = oficial.hostname;
  destino.port = oficial.port;
  return destino;
}
