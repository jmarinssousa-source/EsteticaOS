import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

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

export const metadata: Metadata = {
  title: "EstéticaOS — Gestão completa para clínicas de estética",
  description:
    "Agenda, prontuário, financeiro e CRM de leads num só sistema, feito para o dia a dia de clínicas de estética.",
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
          {children}
          <Toaster />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
