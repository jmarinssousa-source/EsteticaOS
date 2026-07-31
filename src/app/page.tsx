import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing, FAQ } from "@/components/marketing/Landing";
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

export default async function Home() {
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
      <Landing />
    </>
  );
}
