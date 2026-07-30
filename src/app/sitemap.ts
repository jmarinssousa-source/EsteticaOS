import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Só as páginas públicas que fazem sentido para quem chega de busca. O
 * resto do sistema exige login e não entra aqui — nem as páginas de
 * token do paciente, que o robots.txt também bloqueia.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/cadastro`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
