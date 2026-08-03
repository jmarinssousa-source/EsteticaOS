import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CANONICAL_GUARD_COOKIE, canonicalRedirect } from "@/lib/canonical-host";
import { NONCE_HEADER, buildCsp, generateNonce } from "@/lib/security/csp";

const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/verificar-email",
  "/recuperar-senha",
  "/redefinir-senha",
  "/conta-desativada",
  // Volta dos links de e-mail. Precisa ser pública pela própria
  // natureza: quem chega por aqui ainda não tem sessão, é justamente o
  // que essas rotas vão criar. Barrar aqui manda o convidado para o
  // login e queima o token do convite sem nunca usá-lo.
  "/auth/callback",
  "/auth/confirm",
  // Webhook do provedor de pagamento. Quem bate aqui é servidor, nunca
  // navegador: sem esta linha o proxy responderia um redirect para o
  // login e a confirmação de pagamento morreria no caminho. A
  // autorização é o segredo conferido dentro da própria rota.
  "/api/webhooks",
  // Links que o paciente abre sem ter conta, autorizados só pela posse
  // do token na URL.
  "/anamnese",
  "/termo",
  // Imagem de pré-visualização dos links: quem busca é o robô do
  // WhatsApp/rede social, sempre sem sessão.
  "/opengraph-image",
  // Arquivos que buscador nenhum consegue pedir com sessão. Sem isto o
  // Google recebe um redirect para /login no lugar do robots.txt — e o
  // robots.txt é justamente o que mantém as páginas de token do paciente
  // fora do índice.
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Cabeçalho com o caminho pedido.
 *
 * Layout de servidor não enxerga a rota atual, e o bloqueio por teste
 * vencido precisa saber disso para deixar /plano passar enquanto tranca
 * o resto do painel. O proxy é o único lugar que tem o caminho antes da
 * renderização, então ele carimba aqui e o layout lê com `headers()`.
 */
export const PATHNAME_HEADER = "x-esteticaos-pathname";

export default async function proxy(request: NextRequest) {
  // Nonce novo a cada requisição. É o que permite uma CSP sem
  // `unsafe-inline` para script: os scripts do Next.js nascem carimbados
  // com ele, e qualquer script injetado por outro caminho não tem como
  // adivinhar o valor. Ver lib/security/csp.ts para o inventário do que a
  // política libera e por quê.
  const nonce = generateNonce();
  const csp = buildCsp(
    nonce,
    process.env.NODE_ENV === "development",
    request.headers.get("host"),
  );

  /**
   * Carimba a política na resposta.
   *
   * Precisa ser chamado em toda saída, inclusive nos redirecionamentos:
   * um `NextResponse` novo não herda cabeçalho de outro.
   */
  const comCsp = <T extends NextResponse>(resposta: T): T => {
    resposta.headers.set("Content-Security-Policy", csp);
    return resposta;
  };

  /**
   * Cabeçalhos que seguem para a renderização.
   *
   * O `Content-Security-Policy` vai junto de propósito: é dele que o
   * Next.js lê o nonce para aplicar nos próprios scripts. O `x-nonce`
   * existe para o layout poder repassá-lo aos poucos scripts que o
   * framework não gera sozinho (o tema e o JSON-LD da landing).
   */
  const cabecalhosDaRequisicao = () => {
    const headers = new Headers(request.headers);
    headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
    headers.set(NONCE_HEADER, nonce);
    headers.set("Content-Security-Policy", csp);
    return headers;
  };

  // Antes de qualquer outra coisa: garantir que estamos no domínio
  // oficial. Vem primeiro porque o passo seguinte grava cookie de
  // sessão, e cookie gravado no endereço errado é sessão que some
  // quando a pessoa volta para o endereço certo.
  //
  // `/api` fica de fora: quem chama são servidores (o webhook de
  // pagamento), que não têm cookie para perder e podem não seguir
  // redirect.
  const jaRedirecionado = request.cookies.has(CANONICAL_GUARD_COOKIE);

  if (!request.nextUrl.pathname.startsWith("/api/") && !jaRedirecionado) {
    const oficial = canonicalRedirect(request.nextUrl, request.headers.get("host"));
    if (oficial) {
      // 307, não 308: redirect permanente fica gravado no navegador, e
      // um NEXT_PUBLIC_SITE_URL digitado errado deixaria todo mundo
      // preso fora do sistema até limpar o cache.
      const saida = comCsp(NextResponse.redirect(oficial, 307));
      // Ver CANONICAL_GUARD_COOKIE: corta o laço se a Vercel estiver
      // redirecionando no sentido contrário, no painel.
      saida.cookies.set(CANONICAL_GUARD_COOKIE, "1", {
        path: "/",
        maxAge: 10,
        sameSite: "lax",
      });
      return saida;
    }
  } else if (jaRedirecionado && canonicalRedirect(request.nextUrl, request.headers.get("host"))) {
    // Chegou aqui com a marca e ainda está no host errado: alguém está
    // devolvendo a requisição. Quase sempre é um redirecionamento de
    // domínio configurado no painel da Vercel no sentido contrário.
    console.warn(
      "[proxy] laço de domínio evitado — confira o redirecionamento de domínio na Vercel",
      JSON.stringify({ host: request.headers.get("host"), oficial: process.env.NEXT_PUBLIC_SITE_URL }),
    );
  }

  let response = comCsp(NextResponse.next({ request: { headers: cabecalhosDaRequisicao() } }));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // A resposta é refeita com os cookies novos, então os
          // cabeçalhos precisam ser carimbados de novo: sem isto, toda
          // requisição que renova a sessão chegaria ao layout sem rota
          // (e o bloqueio de plano não saberia onde a pessoa está) e sem
          // nonce (e a página voltaria sem script nenhum).
          response = comCsp(NextResponse.next({ request: { headers: cabecalhosDaRequisicao() } }));
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Optimistic check only — refreshes the session cookie. Real
  // authorization (email verified, active clinic membership) happens in
  // the (dashboard) layout, which has DB access.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname) && pathname !== "/") {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return comCsp(NextResponse.redirect(redirectUrl));
  }

  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    return comCsp(NextResponse.redirect(new URL("/hoje", request.url)));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
