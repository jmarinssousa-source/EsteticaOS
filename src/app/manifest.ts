import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EstéticaOS — Gestão para clínicas de estética",
    short_name: "EstéticaOS",
    description:
      "Agenda, prontuário, financeiro e CRM de leads num só sistema, feito para o dia a dia de clínicas de estética.",
    start_url: "/hoje",
    display: "standalone",
    background_color: "#fdfaf7",
    theme_color: "#b5714f",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
