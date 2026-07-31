import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteUrl } from "@/lib/site-url";
// O convite para instalar o app mora no layout do painel, não aqui: na
// página de vendas ele cobria o botão principal para quem ainda nem tem
// conta — só faz sentido oferecer o atalho a quem já usa o sistema.

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Uma frase só, repetida em todos os lugares que descrevem o produto
 *  para fora: busca, Open Graph, Twitter e manifest do aplicativo.
 *  Sem travessão, porque parte disto vai para prévia de link. */
const SITE_DESCRIPTION =
  "Agenda, prontuário, fotos de evolução, anamnese, CRM, financeiro e estoque num sistema só, feito para a rotina de clínicas de estética. Profissionais e pacientes ilimitados por R$ 217 por mês. Teste grátis por 7 dias, sem cartão.";

export const metadata: Metadata = {
  // Base para as URLs absolutas do Open Graph — sem ela o WhatsApp não
  // consegue baixar a imagem de pré-visualização dos links enviados aos
  // pacientes.
  metadataBase: new URL(siteUrl()),
  // Sem `template`: as telas do painel já trazem o nome do sistema no
  // próprio título, e o modelo duplicaria a marca em cada aba.
  title: "Sistema para clínicas de estética | EstéticaOS",
  description: SITE_DESCRIPTION,
  applicationName: "EstéticaOS",
  keywords: [
    "sistema para clínica de estética",
    "software para clínica de estética",
    "gestão de clínica de estética",
    "prontuário eletrônico estética",
    "agenda para clínica de estética",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "EstéticaOS",
    title: "Sistema para clínicas de estética | EstéticaOS",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema para clínicas de estética | EstéticaOS",
    description: SITE_DESCRIPTION,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstéticaOS",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1815" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Na raiz para as legendas de ícone funcionarem em qualquer
              tela — inclusive login e página inicial, que ficam fora do
              layout do painel. */}
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
