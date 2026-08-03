import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança que valem para toda resposta.
 *
 * A Content-Security-Policy **não** está aqui: ela precisa de um `nonce`
 * novo a cada requisição e por isso mora no `proxy.ts`, que é o único
 * lugar que roda por requisição antes da renderização. O que fica aqui
 * são os cabeçalhos fixos, que não dependem de nada da requisição — e
 * que assim também alcançam as rotas que o proxy não intercepta
 * (arquivos estáticos, imagens, `/_next`).
 */
const securityHeaders = [
  // Só HTTPS, e por bastante tempo. `preload` fica de fora de propósito:
  // entrar na lista de preload dos navegadores é uma decisão difícil de
  // desfazer e exige o domínio inteiro, subdomínios inclusive, em HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Impede o navegador de "adivinhar" o tipo de um arquivo. É o que faz
  // uma foto do prontuário guardada com o tipo errado ser tratada como
  // arquivo quebrado, e não como HTML executável.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nenhum endereço do sistema pode virar moldura em outro site
  // (clickjacking). O `frame-ancestors` da CSP diz o mesmo para
  // navegadores modernos; este aqui cobre os antigos e as rotas fora do
  // alcance do proxy.
  { key: "X-Frame-Options", value: "DENY" },
  // O endereço completo — que em `/anamnese/<token>` e `/termo/<token>` é
  // um segredo — nunca sai para outro site. Para o próprio site o
  // caminho continua indo, que é o que o Next.js usa para navegação.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O sistema não usa câmera, microfone, localização nem pagamento pelo
  // navegador. Declarar isso impede que um script injetado peça.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Sem isolamento entre origens não há vazamento de referência de
  // janela para o site que abriu o nosso.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // O sistema não expõe versão nem pilha de tecnologia para quem só olha
  // os cabeçalhos.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
