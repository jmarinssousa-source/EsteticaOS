import Link from "next/link";
import {
  ArrowRightLeft,
  CalendarCheck,
  Check,
  FileSpreadsheet,
  HandCoins,
  LineChart,
  Lock,
  MessageCircle,
  NotebookPen,
  PackageSearch,
  ShieldCheck,
  Users,
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
import { ClinicDay } from "@/components/marketing/ClinicDay";
import { CrmPreview } from "@/components/marketing/CrmPreview";
import { AgendaPreview } from "@/components/marketing/AgendaPreview";
import { ReceiptPreview } from "@/components/marketing/ReceiptPreview";

/**
 * Assinatura visual da página: uma página de caderno de verdade.
 *
 * Vale a regra do caderno pautado — pauta azul sobre papel creme, e o
 * texto deitado sobre as linhas. A primeira tentativa foi pautar o fundo
 * atrás do texto na cor do tema: sumia no claro e, no escuro, as linhas
 * cortavam as palavras e pareciam defeito de renderização. Com o papel
 * claro dentro da faixa escura, o olho lê "caderno" na hora — e o
 * contraste com a coluna limpa do lado é o argumento da página.
 *
 * A pauta cai a cada 32px e o texto usa `leading-8` (32px), então cada
 * linha escrita ocupa exatamente uma linha do caderno.
 */
const RULE_HEIGHT = 32;

const RULED_PAPER = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${
    RULE_HEIGHT - 1
  }px, oklch(0.72 0.05 250 / 40%) ${RULE_HEIGHT - 1}px ${RULE_HEIGHT}px)`,
};

/** Fundo "tinta": um respiro escuro no meio da página clara, igual nos
 *  dois temas para a seção não sumir no modo escuro. */
const INK = "oklch(0.19 0.018 40)";

const BEFORE_AFTER = [
  {
    before: "Duas clientes marcadas no mesmo horário, porque a agenda mora em dois lugares.",
    after: "Uma agenda só, por profissional, que não deixa marcar em cima.",
  },
  {
    before: "Fim do mês chega e você não sabe quanto entrou de verdade.",
    after: "Faturamento, comissão e contas do mês na primeira tela.",
  },
  {
    before: "A cliente pergunta o que foi aplicado da última vez e ninguém lembra.",
    after: "Prontuário com fotos, anamnese e evolução no cadastro dela.",
  },
  {
    before: "Orçamento mandado no WhatsApp que ninguém acompanha.",
    after: "Cada contato num estágio, com aviso de quem parou de responder.",
  },
  {
    before: "O produto acabou no meio do atendimento.",
    after: "Aviso antes de faltar e antes de vencer a validade.",
  },
];

/** As três saídas que a leitora já tentou, e por que nenhuma serviu.
 *  Vem logo depois da dor: ela precisa saber que a gente entende por que
 *  ela ainda está no caderno mesmo tendo testado sistema antes. */
const WRONG_TURNS = [
  {
    label: "Saída 1",
    title: "O caderno, a planilha e o WhatsApp",
    text: "Funciona até a clínica crescer. Aí a informação se espalha, ninguém acha nada e o mês fecha no escuro.",
  },
  {
    label: "Saída 2",
    title: "O sistema que serve para todo mundo",
    text: "Feito para salão, consultório ou loja e adaptado depois. Não tem anamnese, não tem evolução com foto e não calcula comissão do jeito que a estética paga.",
  },
  {
    label: "Saída 3",
    title: "O sistema corporativo",
    text: "Completo e caro, cheio de módulo que você nunca vai usar, com semanas de implantação e treinamento só para conseguir marcar um horário.",
  },
];

/** A prova do "completo": a lista inteira, sem adjetivo. */
const EVERYTHING = [
  "Agenda",
  "Prontuário",
  "Anamnese digital",
  "Termo de consentimento",
  "Fotos de evolução",
  "Orçamentos",
  "Vendas",
  "Pacotes e sessões",
  "Assinatura do paciente",
  "Financeiro",
  "Comissões",
  "Recibos",
  "Estoque",
  "CRM de leads",
  "Relatórios",
  "Metas do mês",
  "Importação e exportação",
  "Usuários e permissões",
];

const FEATURES = [
  {
    icon: CalendarCheck,
    label: "Agenda",
    title: "Não deixa furo",
    description:
      "O dia inteiro da clínica numa tela, cada profissional com sua cor. Conflito de horário o sistema não deixa passar.",
  },
  {
    icon: NotebookPen,
    label: "Prontuário",
    title: "Guarda a evolução",
    description:
      "Anamnese, fotos de antes e depois e termo assinado, tudo no cadastro da paciente.",
  },
  {
    icon: HandCoins,
    label: "Financeiro",
    title: "Fecha o mês sozinho",
    description:
      "Contas a pagar e a receber, formas de pagamento, comissão por profissional e a meta sempre à vista.",
  },
  {
    icon: Users,
    label: "CRM",
    title: "Não deixa lead esfriar",
    description: 'Do primeiro "oi" no WhatsApp até o fechamento, com aviso de quem está parado.',
  },
  {
    icon: PackageSearch,
    label: "Estoque",
    title: "Avisa antes",
    description: "Quantidade mínima e validade com alerta antes de virar problema no atendimento.",
  },
  {
    icon: LineChart,
    label: "Relatórios",
    title: "Mostra o que vende",
    description:
      "Quanto cada profissional faturou, qual procedimento mais sai, de onde vêm suas clientes.",
  },
  {
    icon: ArrowRightLeft,
    label: "Migração",
    title: "Traz sua base",
    description:
      "Importe de Excel ou CSV. O sistema arruma telefone, CPF e data e avisa linha por linha o que não entrou.",
  },
  {
    icon: MessageCircle,
    label: "Suporte",
    title: "Fala com quem faz",
    description: "WhatsApp direto com quem constrói o sistema, sem fila e sem robô no meio.",
  },
];

const TOUR = [
  {
    title: "O funil de quem ainda não marcou",
    description: 'Cada contato num estágio claro, do primeiro "oi" até o fechamento.',
    preview: <CrmPreview />,
  },
  {
    title: "O dia, dividido por profissional",
    description: "A agenda da clínica inteira numa lista simples, sem planilha nem caderno.",
    preview: <AgendaPreview />,
  },
  {
    title: "O recibo com a cara da clínica",
    description: "Nome, endereço e dados da sua clínica, prontos para mandar ou salvar em PDF.",
    preview: <ReceiptPreview />,
  },
];

/** Passos com o tempo real de cada um: o que a leitora quer saber aqui é
 *  quanto isso vai custar do dia dela, não a ordem — a ordem é óbvia. */
const STEPS = [
  {
    duration: "2 min",
    title: "Crie sua conta",
    description: `Nome da clínica e e-mail. Sem cartão. Os ${TRIAL_DAYS} dias começam na hora.`,
  },
  {
    duration: "10 min",
    title: "Traga sua base",
    description: "Importe pacientes e procedimentos de uma planilha — ou comece cadastrando.",
  },
  {
    duration: "5 min",
    title: "Chame sua equipe",
    description: "Cada pessoa com o acesso certo: recepção vê agenda, financeiro vê caixa.",
  },
];

const FAQ = [
  {
    question: `O que acontece quando terminam os ${TRIAL_DAYS} dias?`,
    answer:
      "Nada é apagado. Seus dados continuam guardados do jeito que estão e você decide se quer ativar o plano. O aviso aparece na tela alguns dias antes, com o prazo exato.",
  },
  {
    question: "Preciso cadastrar cartão para testar?",
    answer:
      "Não. O teste é liberado com e-mail e o nome da clínica. Cartão só entra na conversa se você decidir continuar.",
  },
  {
    question: "Já uso outro sistema. Consigo trazer meus dados?",
    answer:
      "Sim. Exporte de onde você está hoje em Excel ou CSV e importe em Configurações > Importação/Exportação. O sistema entende telefone e CPF com ou sem máscara, corrige datas e mostra linha por linha o que não entrou e por quê.",
  },
  {
    question: "Quantas pessoas podem usar?",
    answer:
      "Quantas você precisar, cada uma com sua permissão. A recepção pode ver a agenda sem ver o financeiro; o profissional vê os próprios atendimentos. Você ajusta permissão por permissão.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Funciona. É um site que abre em qualquer navegador e pode ser instalado na tela inicial do celular como aplicativo, no Android e no iPhone.",
  },
  {
    question: "E a segurança dos dados das minhas clientes?",
    answer:
      "Cada clínica só enxerga os próprios dados, isolados por regra no banco — é bloqueio no servidor, não filtro de tela. As fotos de prontuário ficam em armazenamento privado, aberto só para quem tem permissão na sua clínica.",
  },
];

/** Sobrescrita de rótulo em mono, usada no lugar de "badge" decorativo. */
function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${className ?? ""}`}>
      {children}
    </p>
  );
}

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
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
        {/* ===========================================================
            HERÓI — a tese e a prova lado a lado. O objeto da direita é
            o dia da clínica, não um print do painel. */}
        <section className="px-4 pb-20 pt-14 md:px-6 md:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Eyebrow className="text-primary">Gestão para clínica de estética</Eyebrow>
              <h1 className="mt-4 font-heading text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                O caderno sabe quem vem às 9h.
                <span className="mt-2 block text-muted-foreground">Não sabe se o mês fecha.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                Agenda, prontuário, financeiro, estoque e CRM de leads no mesmo lugar. Completo como
                sistema grande, direto como caderno — e feito só para clínica de estética. Você
                passa a saber, a qualquer hora, quem vem hoje, quanto entrou no mês e o que está
                prestes a faltar.
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

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {["Sem cartão de crédito", "Tudo liberado no teste", "Cancele quando quiser"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      <Check className="size-3.5 text-sage" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <ClinicDay />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                A última linha é a que o caderno não tem.
              </p>
            </div>
          </div>
        </section>

        {/* ===========================================================
            TINTA — a dor. Fundo escuro para dar respiro no meio de uma
            página clara, e as pautas voltam só do lado "como é hoje". */}
        {/* O fio branco delimita a faixa: no tema escuro o fundo "tinta"
            fica perto demais do fundo da página e a seção sumiria. */}
        <section
          className="border-y border-white/10 px-4 py-20 text-[oklch(0.95_0.01_75)] md:px-6"
          style={{ backgroundColor: INK }}
        >
          <div className="mx-auto max-w-5xl">
            <Eyebrow className="text-[oklch(0.8_0.09_85)]">O que não está escrito</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Se alguma dessas linhas é o seu dia, o problema não é falta de esforço.
            </h2>
            <p className="mt-4 max-w-2xl text-[oklch(0.78_0.015_60)]">
              É falta de um lugar só onde a clínica inteira esteja.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 sm:gap-10">
              {/* A página de caderno. Cada item ocupa 3 linhas de pauta
                  (96px) para casar item a item com a coluna da direita. */}
              <div>
                <Eyebrow className="mb-4 text-[oklch(0.68_0.02_50)]">Como é hoje</Eyebrow>
                <div className="rounded-lg bg-[oklch(0.96_0.016_85)] px-5 py-4 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.7)]">
                  <ul style={RULED_PAPER}>
                    {BEFORE_AFTER.map((row) => (
                      <li
                        key={row.before}
                        className="text-sm leading-8 text-[oklch(0.36_0.03_40)] sm:min-h-24"
                      >
                        {row.before}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <Eyebrow className="mb-4 text-[oklch(0.8_0.09_85)]">Com o sistema</Eyebrow>
                {/* `pt-4` alinha o topo da lista com o do papel, que tem a
                    mesma folga interna. */}
                <ul className="pt-4">
                  {BEFORE_AFTER.map((row) => (
                    <li
                      key={row.after}
                      className="flex gap-3 text-sm leading-8 font-medium sm:min-h-24"
                    >
                      <Check
                        className="mt-2 size-4 shrink-0 text-[oklch(0.8_0.09_85)]"
                        aria-hidden
                      />
                      <span>{row.after}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===========================================================
            As saídas que ela já tentou. Mesma linguagem estrutural dos
            passos: fio fino em cima, rótulo em mono. */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Eyebrow className="text-primary">Por que ainda não resolveu</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Você provavelmente já tentou uma destas três
            </h2>

            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {WRONG_TURNS.map((item) => (
                <div key={item.title} className="border-t border-border pt-5">
                  <Eyebrow className="text-muted-foreground">{item.label}</Eyebrow>
                  <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-14 max-w-3xl font-heading text-xl leading-snug sm:text-2xl">
              O EstéticaOS é completo como o terceiro e simples como o primeiro — e cada tela foi
              desenhada para o que acontece dentro de{" "}
              <span className="text-primary">uma clínica de estética</span>, não para um negócio
              genérico.
            </p>
          </div>
        </section>

        {/* =========================================================== */}
        <section className="border-t border-border/60 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow className="text-primary">O que tem dentro</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              A clínica inteira, num sistema só
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Da primeira mensagem da cliente ao recibo do atendimento. Sem trocar de programa no
              meio do caminho e sem contratar módulo à parte.
            </p>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-card p-6">
                  <feature.icon className="size-5 text-primary" aria-hidden />
                  <Eyebrow className="mt-4 text-muted-foreground">{feature.label}</Eyebrow>
                  <h3 className="mt-1.5 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* "Completo" só convence com a lista na mesa. */}
            <div className="mt-10 rounded-2xl border border-border p-6 sm:p-8">
              <Eyebrow className="text-muted-foreground">Tudo isto está incluído</Eyebrow>
              <ul className="mt-5 flex flex-wrap gap-x-2.5 gap-y-2">
                {EVERYTHING.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                Um preço só, sem módulo cobrado à parte e sem limite de usuários. No teste de{" "}
                {TRIAL_DAYS} dias tudo isso já vem liberado.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================== */}
        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow className="text-primary">Por dentro</Eyebrow>
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Como fica na prática
            </h2>
            <div className="mt-12 grid items-stretch gap-10 lg:grid-cols-3">
              {TOUR.map((item) => (
                <div key={item.title} className="flex flex-col">
                  <div className="flex-1">{item.preview}</div>
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===========================================================
            A objeção de quem já usa outro sistema. */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow className="text-primary">Migração</Eyebrow>
              <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Você não vai redigitar sua base inteira
              </h2>
              <p className="mt-4 text-muted-foreground">
                Exporte do sistema que você usa hoje — ou pegue a planilha onde a clínica está — e
                importe direto. Baixe o modelo, cole seus dados, envie.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Telefone e CPF entram com ou sem máscara; o sistema padroniza.",
                  "Datas em dd/mm/aaaa ou aaaa-mm-dd, tanto faz.",
                  "Paciente repetido é reconhecido e não entra duas vezes.",
                  "No fim, a lista do que entrou e o motivo de cada linha que ficou de fora.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
              {[
                {
                  icon: Lock,
                  title: "Cada clínica isolada",
                  text: "Bloqueio no banco, não filtro de tela.",
                },
                {
                  icon: ShieldCheck,
                  title: "Fotos em local privado",
                  text: "Só abre quem tem permissão na sua clínica.",
                },
                {
                  icon: NotebookPen,
                  title: "Histórico preservado",
                  text: "Nada some quando o teste vence.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Exporte quando quiser",
                  text: "Seus dados saem em Excel ou CSV.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-card p-6">
                  <card.icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-4 text-sm font-semibold">{card.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================== */}
        <section className="border-t border-border/60 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Eyebrow className="text-primary">Começar</Eyebrow>
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Do cadastro ao primeiro atendimento, hoje mesmo
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.title} className="border-t border-border pt-5">
                  <span className="font-mono text-sm tabular-nums text-primary">
                    {step.duration}
                  </span>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* =========================================================== */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl">
            <Eyebrow className="text-primary">Antes de começar</Eyebrow>
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Perguntas que todo mundo faz
            </h2>
            <div className="mt-10">
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

        {/* =========================================================== */}
        <section className="px-4 pb-24 md:px-6">
          <div
            className="mx-auto max-w-4xl rounded-3xl border border-white/10 px-6 py-16 text-center text-[oklch(0.95_0.01_75)] sm:px-14"
            style={{ backgroundColor: INK }}
          >
            <LogoMark className="mx-auto size-11" />
            <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Amanhã às 9h você vai saber quem vem — e quanto o mês fecha
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[oklch(0.78_0.015_60)]">
              {TRIAL_DAYS} dias com tudo liberado, sem cartão de crédito. Se não for para você, é só
              não continuar — seus dados ficam guardados do mesmo jeito.
            </p>
            <Button size="lg" className="mt-8" nativeButton={false} render={<Link href="/cadastro" />}>
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
