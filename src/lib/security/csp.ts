/**
 * Content-Security-Policy do EstéticaOS.
 *
 * Função pura, sem `next/headers` e sem `server-only`: quem chama é o
 * `proxy.ts`, e lá dentro nenhum dos dois existe.
 *
 * ## O que a política precisa deixar passar
 *
 * A lista abaixo foi levantada olhando o que o sistema realmente carrega,
 * não copiada de exemplo. Cada permissão tem dono:
 *
 * - **Scripts.** Só os do próprio Next.js, liberados pelo `nonce` que
 *   nasce nesta requisição. `strict-dynamic` deixa os pedaços que o
 *   framework carrega sozinho (rotas, `import()` dinâmico) herdarem a
 *   confiança do script que os pediu, sem precisar listar cada arquivo.
 *   Não há script de terceiro no sistema: nem analytics, nem chat, nem
 *   pixel.
 * - **Estilos.** `unsafe-inline` é necessário e é uma escolha consciente.
 *   Os menus, diálogos e tooltips do Base UI posicionam-se escrevendo no
 *   atributo `style` do elemento, e `nonce` não vale para atributo —
 *   vale só para a tag `<style>`. Sem isto, todo menu suspenso do painel
 *   abre no lugar errado. O risco que sobra (injeção de CSS) é muito
 *   menor que o de scripts, e a proteção contra o que importa —
 *   `script-src` — continua intacta.
 * - **Imagens.** As fotos de evolução e os mapas do prontuário vêm por
 *   URL assinada do Supabase Storage, em outro domínio. `data:` é da
 *   assinatura desenhada no canvas; `blob:` é da pré-visualização da
 *   foto antes do envio.
 * - **Conexões.** O navegador fala com o Supabase (sessão e autenticação)
 *   e com mais ninguém.
 * - **Fontes.** Servidas pelo próprio domínio: o `next/font` baixa as
 *   fontes do Google no build e as publica junto com o site, então não há
 *   pedido para fonts.gstatic.com em tempo de execução.
 * - **Worker.** O `sw.js` que faz o sistema abrir como aplicativo.
 *
 * E o que a política corta: `object-src` (Flash/embed), `frame-src`
 * (nenhum iframe), `frame-ancestors` (ninguém emoldura o sistema),
 * `base-uri` (impede que uma injeção reescreva a base dos links).
 */

/** Só a origem, para não pôr caminho nenhum dentro da política. */
function origem(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * O endereço desta requisição é um `localhost`?
 *
 * Serve para decidir o `upgrade-insecure-requests`. Ao contrário do que a
 * documentação sugere, o Chrome **não** isenta `localhost` dessa
 * diretiva: rodar um build de produção com `next start` na máquina passa
 * a pedir `https://localhost` e devolve erro de SSL. Verificado no
 * navegador, não deduzido.
 */
function ehLocalhost(host: string | null): boolean {
  if (!host) return false;
  const nome = host.toLowerCase().split(":")[0];
  return nome === "localhost" || nome === "127.0.0.1" || nome === "[::1]";
}

export function buildCsp(nonce: string, isDev: boolean, host?: string | null): string {
  const supabase = origem(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // O Supabase mantém a sessão viva por WebSocket no mesmo endereço.
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:").replace(/^http:/, "ws:") : null;

  const conexoes = ["'self'", supabase, supabaseWs].filter(Boolean).join(" ");
  const imagens = ["'self'", "data:", "blob:", supabase].filter(Boolean).join(" ");

  const diretivas = [
    "default-src 'self'",
    // Em desenvolvimento o React usa `eval` para remontar a pilha de erro
    // do servidor dentro do navegador. Em produção não usa, e aí a
    // permissão não existe.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imagens}`,
    "font-src 'self'",
    `connect-src ${conexoes}${isDev ? " ws: http://localhost:*" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
  ];

  // Na máquina de quem desenvolve o sistema roda em `http://localhost`, e
  // forçar HTTPS ali deixaria a aplicação inacessível — inclusive num
  // `next start`, que roda com NODE_ENV=production.
  if (!isDev && !ehLocalhost(host ?? null)) {
    diretivas.push("upgrade-insecure-requests");
  }

  return diretivas.join("; ");
}

/** Cabeçalho por onde o layout recebe o nonce desta requisição. */
export const NONCE_HEADER = "x-nonce";

export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
