import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing, FAQ } from "@/components/marketing/Landing";
import { AuthHashCatcher } from "@/components/auth/AuthHashCatcher";
import {
  PLAN_MONTHLY_PRICE_CENTS,
  PLAN_NAME,
  PLAN_YEARLY_PRICE_CENTS,
} from "@/lib/plan/pricing";
import { siteUrl } from "@/lib/site-url";

/**
 * Dados estruturados da página pública.
 *
 * Só campos que dão para provar. O `offers` entrou agora que existe
 * preço público, e os dois valores saem das mesmas constantes que a
 * landing renderiza: o que o robô lê é o que está na tela, sempre.
 *
 * Continua sem `aggregateRating`: não existe avaliação publicada, e nota
 * inventada em dado estruturado é o tipo de coisa que o buscador pune e
 * que a leitora descobre na primeira busca.
 *
 * As perguntas também saem da mesma constante que a página renderiza.
 */
function structuredData(base: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EstéticaOS",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Sistema de gestão para clínicas de estética",
      operatingSystem: "Web, Android, iOS",
      url: base,
      inLanguage: "pt-BR",
      description:
        "Agenda, prontuário, fotos de evolução, anamnese, CRM, financeiro e estoque num sistema só, feito para a rotina de clínicas de estética. Profissionais e pacientes ilimitados.",
      publisher: { "@type": "Organization", name: "Orbyniq" },
      offers: [
        {
          "@type": "Offer",
          name: `${PLAN_NAME}, mensal`,
          price: (PLAN_MONTHLY_PRICE_CENTS / 100).toFixed(2),
          priceCurrency: "BRL",
          category: "subscription",
          url: `${base}#preco`,
        },
        {
          "@type": "Offer",
          name: `${PLAN_NAME}, anual`,
          price: (PLAN_YEARLY_PRICE_CENTS / 100).toFixed(2),
          priceCurrency: "BRL",
          category: "subscription",
          url: `${base}#preco`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error_code?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Rede de segurança do link de e-mail.
  //
  // Quando o `redirect_to` do convite não bate com a lista de Redirect
  // URLs do projeto, o Supabase descarta o destino e larga a pessoa na
  // Site URL, que é esta página, com o código de autenticação pendurado
  // na query. Era assim que o convidado caía na landing em vez da tela
  // de senha. Em vez de perder o código, ele é devolvido ao callback,
  // que sabe o que fazer com ele.
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }
  if (params.error_code || params.error) {
    redirect("/login?error=link-invalido");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/hoje");
  }

  return (
    <>
      <script
        type="application/ld+json"
        // `<` vira escape unicode para nenhuma string do conteúdo poder
        // fechar a tag e virar injeção.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData(siteUrl())).replace(/</g, "\\u003c"),
        }}
      />
      {/* Quando o Supabase recusa o destino do link, ele larga a pessoa
          aqui — com a sessão no fragmento da URL, que só o navegador
          enxerga. Sem isto o convidado fica olhando a landing. */}
      <AuthHashCatcher />
      <Landing />
    </>
  );
}
