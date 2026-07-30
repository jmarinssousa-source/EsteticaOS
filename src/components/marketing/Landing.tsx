import Link from "next/link";
import {
  ArrowRightLeft,
  CalendarCheck,
  Check,
  Clock,
  FileSpreadsheet,
  HandCoins,
  LineChart,
  Lock,
  MessageCircle,
  NotebookPen,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { TRIAL_DAYS } from "@/lib/plan/trial";
import { supportWhatsAppUrl } from "@/lib/brand";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { CrmPreview } from "@/components/marketing/CrmPreview";
import { AgendaPreview } from "@/components/marketing/AgendaPreview";
import { ReceiptPreview } from "@/components/marketing/ReceiptPreview";

/** O par de dores que abre a página. Cada linha é uma frase que a dona da
 *  clínica reconhece como sendo o dia dela, seguida do que muda. */
const BEFORE_AFTER = [
  {
    before: "Duas clientes marcadas no mesmo horário porque a agenda está em dois lugares.",
    after: "Uma agenda só, por profissional, que não deixa marcar em cima.",
  },
  {
    before: "Fim do mês chega e você não sabe quanto entrou de verdade.",
    after: "Faturamento, comissões e contas do mês na tela inicial.",
  },
  {
    before: "A cliente pergunta o que foi aplicado da última vez e ninguém lembra.",
    after: "Prontuário com fotos, anamnese e evolução no cadastro dela.",
  },
  {
    before: "Orçamento mandado no WhatsApp que ninguém acompanha.",
    after: "Cada lead com um estágio, e alerta de quem parou de responder.",
  },
  {
    before: "Produto acabou no meio do atendimento.",
    after: "Aviso antes de faltar e antes de vencer a validade.",
  },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Agenda que não deixa furo",
    description:
      "O dia inteiro da clínica numa tela, cada profissional com sua cor. Conflito de horário o sistema não deixa passar.",
  },
  {
    icon: NotebookPen,
    title: "Prontuário completo",
    description:
      "Anamnese, fotos de antes e depois, evolução e termo de consentimento assinado — tudo no cadastro da paciente.",
  },
  {
    icon: HandCoins,
    title: "Financeiro sem planilha",
    description:
      "Contas a pagar e a receber, formas de pagamento, comissão por profissional e a meta do mês sempre visível.",
  },
  {
    icon: Users,
    title: "CRM que não deixa lead esfriar",
    description:
      "Do primeiro \"oi\" no WhatsApp até o fechamento, com aviso de quem está parado há dias.",
  },
  {
    icon: PackageSearch,
    title: "Estoque sob controle",
    description: "Quantidade mínima e validade com alerta antes de virar problema no atendimento.",
  },
  {
    icon: LineChart,
    title: "Relatórios de verdade",
    description:
      "Quanto cada profissional faturou, qual procedimento mais vende, de onde vêm suas clientes.",
  },
  {
    icon: ArrowRightLeft,
    title: "Migração sem dor de cabeça",
    description:
      "Traga sua base em Excel ou CSV. O sistema arruma telefone, CPF e datas sozinho e avisa linha por linha o que não entrou.",
  },
  {
    icon: MessageCircle,
    title: "Suporte com quem faz o sistema",
    description: "WhatsApp direto, sem fila de atendimento e sem robô no meio.",
  },
];

const TOUR = [
  {
    title: "CRM que não deixa lead esfriar",
    description: "Cada contato num estágio claro, do primeiro \"oi\" até o fechamento.",
    preview: <CrmPreview />,
  },
  {
    title: "Agenda organizada por profissional",
    description: "O dia inteiro da clínica numa lista simples, sem planilha nem caderno.",
    preview: <AgendaPreview />,
  },
  {
    title: "Recibo com a cara da sua clínica",
    description: "Nome, endereço e dados da clínica, prontos para mandar no WhatsApp ou salvar em PDF.",
    preview: <ReceiptPreview />,
  },
];

const STEPS = [
  {
    title: "Crie sua conta",
    description: `Menos de 2 minutos, sem cartão de crédito. Os ${TRIAL_DAYS} dias começam na hora.`,
  },
  {
    title: "Traga sua base",
    description: "Importe pacientes e procedimentos de uma planilha, ou comece do zero cadastrando.",
  },
  {
    title: "Chame sua equipe",
    description: "Cada pessoa entra com o acesso certo: recepção vê agenda, financeiro vê caixa.",
  },
];

const FAQ = [
  {
    question: `O que acontece quando terminam os ${TRIAL_DAYS} dias?`,
    answer:
      "Nada é apagado. Seus dados continuam guardados do jeito que estão e você decide se quer ativar o plano para continuar usando. Avisamos antes de acabar, com o prazo na tela.",
  },
  {
    question: "Preciso cadastrar cartão para testar?",
    answer:
      "Não. O teste é liberado só com e-mail e o nome da clínica. Cartão só entra na conversa se você decidir continuar.",
  },
  {
    question: "Já uso outro sistema. Consigo trazer meus dados?",
    answer:
      "Sim. Exporte de onde você está hoje em Excel ou CSV e importe direto em Configurações > Importação/Exportação. O sistema entende telefone e CPF com ou sem máscara, corrige datas e mostra linha por linha o que não entrou e por quê.",
  },
  {
    question: "Quantas pessoas podem usar?",
    answer:
      "Quantas você precisar, cada uma com sua permissão. A recepção pode ver a agenda sem ver o financeiro; o profissional vê os próprios atendimentos. Você ajusta permissão por permissão.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Funciona. É um site que abre em qualquer navegador e pode ser instalado na tela inicial do celular como um aplicativo, no Android e no iPhone.",
  },
  {
    question: "E a segurança dos dados das minhas clientes?",
    answer:
      "Cada clínica só enxerga os próprios dados, isolados no banco por regra de acesso — não é filtro de tela, é bloqueio no servidor. As fotos de prontuário ficam em armazenamento privado, acessível só por quem tem permissão na sua clínica.",
  },
];

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button nativeButton={false} render={<Link href="/cadastro" />}>
              Testar grátis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------------------------------------------------------
            Herói: a promessa em uma frase, a prova logo ao lado. */}
        <section className="relative overflow-hidden px-4 pb-16 pt-14 md:px-6 md:pt-20">
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-champagne" aria-hidden />
                Feito só para clínicas de estética
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Sua clínica não cabe mais{" "}
                <span className="text-primary">no caderno e na planilha.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Agenda, prontuário, financeiro, estoque e CRM de leads no mesmo lugar. Você para de
                caçar informação em três cadernos e um grupo de WhatsApp — e passa a saber, a
                qualquer hora, quem vem hoje, quanto entrou no mês e o que está prestes a faltar.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" nativeButton={false} render={<Link href="/cadastro" />}>
                  Testar {TRIAL_DAYS} dias grátis
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Já tenho conta
                </Button>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {["Sem cartão de crédito", "Tudo liberado no teste", "Cancele quando quiser"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-sage" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* ---------------------------------------------------------------
            A dor, em duas colunas. É a seção que faz a pessoa se
            reconhecer antes de a gente falar de recurso nenhum. */}
        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Se alguma dessas frases é o seu dia, o problema não é falta de esforço.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              É falta de um lugar só onde a clínica inteira esteja. Veja o que muda:
            </p>

            <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                <div className="bg-card px-5 py-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <X className="size-4 text-destructive" aria-hidden />
                    Como é hoje
                  </p>
                </div>
                <div className="hidden bg-card px-5 py-3 sm:block">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Check className="size-4" aria-hidden />
                    Com o EstéticaOS
                  </p>
                </div>

                {BEFORE_AFTER.map((row) => (
                  <div key={row.before} className="contents">
                    <div className="bg-card px-5 py-4 text-sm text-muted-foreground">
                      {row.before}
                    </div>
                    <div className="bg-card px-5 py-4 text-sm font-medium">
                      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary sm:hidden">
                        <Check className="size-3.5" aria-hidden />
                        Com o EstéticaOS
                      </span>
                      {row.after}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Um sistema de gestão de verdade, não uma agenda com nome bonito
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Pensado do zero para clínica de estética — não adaptado de software de salão, de
              consultório médico ou de loja.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <feature.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Como fica na prática</h2>
            {/* As três telas têm alturas diferentes; `flex-1` no bloco da
                imagem empurra os títulos para a mesma linha de base. */}
            <div className="mt-10 grid items-stretch gap-10 lg:grid-cols-3">
              {TOUR.map((item) => (
                <div key={item.title} className="flex flex-col">
                  <div className="flex-1">{item.preview}</div>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Objeção número um de quem já usa outro sistema. */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <FileSpreadsheet className="size-3.5 text-primary" aria-hidden />
                Migração
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Você não vai redigitar sua base inteira
              </h2>
              <p className="mt-3 text-muted-foreground">
                Exporte do sistema que você usa hoje — ou pegue a planilha onde a clínica está — e
                importe direto. Baixe o modelo, cole seus dados, envie.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Telefone e CPF entram com ou sem máscara; o sistema padroniza.",
                  "Datas em dd/mm/aaaa ou aaaa-mm-dd, tanto faz.",
                  "Paciente repetido é detectado e não entra duas vezes.",
                  "No fim, a lista do que entrou e o motivo de cada linha que ficou de fora.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lock, title: "Cada clínica isolada", text: "Bloqueio no banco, não filtro de tela." },
                { icon: ShieldCheck, title: "Fotos em local privado", text: "Só quem tem permissão abre." },
                { icon: Clock, title: "Histórico preservado", text: "Nada some quando o teste vence." },
                { icon: ArrowRightLeft, title: "Exporte quando quiser", text: "Seus dados saem em Excel ou CSV." },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
                  <card.icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">{card.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Do cadastro ao primeiro atendimento, hoje mesmo
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
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Perguntas que todo mundo faz antes de começar
            </h2>
            <div className="mt-8">
              <Accordion>
                {FAQ.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Ficou outra dúvida?{" "}
              <a
                href={supportWhatsAppUrl("Tenho uma dúvida sobre o EstéticaOS.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4"
              >
                Chame no WhatsApp
              </a>{" "}
              — responde quem faz o sistema.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="border-t border-border/60 px-4 py-20 md:px-6">
          <div
            className="mx-auto max-w-4xl rounded-3xl border border-border p-10 text-center sm:p-14"
            style={{
              background: "radial-gradient(80% 100% at 50% 0%, oklch(0.82 0.09 85 / 25%), transparent)",
            }}
          >
            <LogoMark className="mx-auto size-12" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              Comece hoje e veja sua clínica organizada ainda esta semana
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {TRIAL_DAYS} dias com tudo liberado, sem cartão de crédito. Se não for para você, é só
              não continuar — seus dados ficam guardados do mesmo jeito.
            </p>
            <Button size="lg" className="mt-6" nativeButton={false} render={<Link href="/cadastro" />}>
              Criar minha conta grátis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Logo markClassName="size-5" wordmarkClassName="text-base" />
          <OrbyniqBadge className="items-center text-center sm:items-end sm:text-right" />
        </div>
      </footer>
    </div>
  );
}
