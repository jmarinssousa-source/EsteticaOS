import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * O que os buscadores podem varrer.
 *
 * `/anamnese` e `/termo` são as páginas que o paciente abre sem ter
 * conta, autorizadas só pela posse do token na URL. Elas respondem 200
 * para qualquer um que tenha o link, então precisam ficar fora do índice
 * — uma ficha de anamnese aparecendo em busca do Google seria vazamento
 * de dado de saúde.
 *
 * As telas do painel já exigem sessão e redirecionam para o login, mas
 * entram na lista assim mesmo: evita que os robôs gastem rastreamento em
 * páginas que nunca vão render conteúdo.
 */
const PRIVATE_PATHS = [
  "/anamnese/",
  "/termo/",
  "/auth/",
  "/hoje",
  "/agenda",
  "/pacientes",
  "/crm",
  "/orcamentos",
  "/sessoes",
  "/financeiro",
  "/estoque",
  "/relatorios",
  "/configuracoes",
  "/plano",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
