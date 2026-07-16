import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightLeft,
  CalendarCheck,
  HandCoins,
  LineChart,
  MessageCircle,
  NotebookPen,
  PackageSearch,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { CrmPreview } from "@/components/marketing/CrmPreview";
import { AgendaPreview } from "@/components/marketing/AgendaPreview";
import { ReceiptPreview } from "@/components/marketing/ReceiptPreview";

const FEATURES = [
  {
    icon: Users,
    title: "Nenhum lead esquecido",
    description:
      "Acompanhe cada contato da primeira mensagem até o agendamento, com alertas para quem parou de responder.",
  },
  {
    icon: CalendarCheck,
    title: "Menos furos na agenda",
    description: "Veja o dia inteiro da clínica de uma vez e evite conflitos de horário entre profissionais.",
  },
  {
    icon: HandCoins,
    title: "Contas em dia, sem susto",
    description: "Contas a pagar e a receber organizadas, com a meta do mês sempre visível.",
  },
  {
    icon: NotebookPen,
    title: "Evolução documentada",
    description: "Fotos, anamnese e mapas de evolução guardados com o paciente, prontos para consultar em segundos.",
  },
  {
    icon: PackageSearch,
    title: "Insumos sob controle",
    description: "Alertas antes de faltar produto ou vencer validade.",
  },
  {
    icon: LineChart,
    title: "Decisões com dado, não achismo",
    description: "Receita por profissional, procedimento mais vendido, tudo num relatório.",
  },
  {
    icon: ArrowRightLeft,
    title: "Migração sem dor de cabeça",
    description: "Já usa outro sistema? Exporte seus dados e importe direto no EstéticaOS, em poucos cliques.",
  },
  {
    icon: MessageCircle,
    title: "Suporte direto com quem constrói o sistema",
    description: "Fala com a gente pelo WhatsApp quando precisar, sem fila de atendimento nem robô.",
  },
];

const TOUR = [
  {
    title: "CRM que não deixa lead esfriar",
    description: "Cada contato tem um estágio claro, do primeiro \"oi\" até o fechamento.",
    preview: <CrmPreview />,
  },
  {
    title: "Agenda organizada por profissional",
    description: "O dia inteiro da clínica numa lista simples, sem planilha nem caderno.",
    preview: <AgendaPreview />,
  },
  {
    title: "Recibo personalizado com a sua clínica",
    description: "Nome, endereço e dados da sua clínica, prontos para enviar por WhatsApp ou salvar em PDF.",
    preview: <ReceiptPreview />,
  },
];

const STEPS = [
  {
    title: "Cadastre sua clínica",
    description: "Leva menos de 2 minutos, sem cartão de crédito.",
  },
  {
    title: "Convide sua equipe",
    description: "Cada pessoa entra com o nível de acesso certo: recepção, financeiro, profissional.",
  },
  {
    title: "Comece a atender",
    description: "Agenda, prontuário e financeiro já funcionando desde o primeiro dia.",
  },
];

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="" width={28} height={28} unoptimized className="rounded-lg" />
            <span className="font-heading text-xl font-semibold tracking-tight">EstéticaOS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button render={<Link href="/cadastro" />}>Criar conta</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 md:px-6 md:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(55% 45% at 50% 0%, oklch(0.93 0.03 150 / 55%), transparent), radial-gradient(40% 40% at 90% 15%, oklch(0.82 0.09 85 / 32%), transparent)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Feito só para clínicas de estética
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Agenda, financeiro e pacientes organizados numa única tela.
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Chega de espalhar sua clínica entre planilha, caderno e grupo de WhatsApp. O EstéticaOS
                junta agenda, prontuário, financeiro, estoque e CRM de leads num só sistema, pensado do
                zero para clínica de estética, não adaptado de outro tipo de negócio.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" render={<Link href="/cadastro" />}>
                  Começar teste grátis de 15 dias
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/login" />}>
                  Já tenho conta
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                15 dias grátis, sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Tudo que sua clínica precisa, sem depender de planilha
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
                  <feature.icon className="size-5 text-primary" />
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Como fica na prática</h2>
            <div className="mt-10 grid gap-10 lg:grid-cols-3">
              {TOUR.map((item) => (
                <div key={item.title}>
                  {item.preview}
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Comece a usar em três passos
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="font-heading text-3xl font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Já usa outro sistema de gestão? A migração é simples: exporte seus dados e importe direto
              no EstéticaOS, em Configurações {'>'} Importação/Exportação.
            </p>
          </div>
        </section>

        <section className="border-t border-border/60 px-4 py-20 md:px-6">
          <div
            className="mx-auto max-w-4xl rounded-3xl border border-border p-10 text-center sm:p-14"
            style={{
              background: "radial-gradient(80% 100% at 50% 0%, oklch(0.82 0.09 85 / 25%), transparent)",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pronta pra tirar sua clínica do caderno?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Crie sua conta agora e comece a organizar agenda, financeiro e pacientes ainda hoje. 15
              dias grátis, sem cartão de crédito.
            </p>
            <Button size="lg" className="mt-6" render={<Link href="/cadastro" />}>
              Começar teste grátis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="" width={20} height={20} unoptimized className="rounded-md" />
            <span className="font-heading text-base font-semibold">EstéticaOS</span>
          </div>
          <OrbyniqBadge className="items-center text-center sm:items-end sm:text-right" />
        </div>
      </footer>
    </div>
  );
}
