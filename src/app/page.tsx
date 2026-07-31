import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing, FAQ } from "@/components/marketing/Landing";
import { siteUrl } from "@/lib/site-url";

/**
 * Dados estruturados da página pública.
 *
 * Só campos que dão para provar. Sem `offers`, porque não existe preço
 * público, e sem `aggregateRating`, porque não existe avaliação nenhuma
 * publicada. Nota inventada em dado estruturado é o tipo de coisa que o
 * buscador pune e que a leitora descobre na primeira busca.
 *
 * As perguntas saem da mesma constante que a página renderiza, então o
 * que o robô lê é exatamente o que está na tela.
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
        "Agenda, prontuário, fotos de evolução, anamnese, CRM, financeiro e estoque num sistema só, feito para a rotina de clínicas de estética.",
      publisher: { "@type": "Organization", name: "Orbyniq" },
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
