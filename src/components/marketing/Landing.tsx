import Link from "next/link";
import {
  CalendarClock,
  Camera,
  Check,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Lock,
  PenLine,
  Percent,
  PackageSearch,
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
import {
  formatPrice,
  PLAN_FEATURES,
  PLAN_MONTHLY_PRICE_CENTS,
  PLAN_NAME,
  PLAN_YEARLY_EQUIVALENT_CENTS,
  PLAN_YEARLY_PRICE_CENTS,
  PLAN_YEARLY_SAVINGS_CENTS,
} from "@/lib/plan/pricing";
import { supportWhatsAppUrl } from "@/lib/brand";
import { ClinicJourney } from "@/components/marketing/ClinicJourney";
import { HojeScreen } from "@/components/marketing/JourneyScreens";

/**
 * Página pública do EstéticaOS.
 *
 * Direção: "a clínica em movimento". A prova da página é o percurso de
 * uma paciente pelo sistema, do primeiro contato ao retorno, com a tela
 * real de cada etapa (ver ClinicJourney). O resto da página é quieto de
 * propósito: a ousadia fica toda na trilha.
 *
 * Regras que valem para tudo o que aparece aqui:
 *
 * - Nada de travessão em texto visível. Ponto, vírgula ou frase nova.
 * - Toda promessa tem prova no código. O que não tem, não entra: a
 *   agenda ainda não bloqueia horário sobreposto, não existe relatório
 *   de procedimento mais vendido, o perfil Profissional ainda enxerga a
 *   agenda inteira e não há preço público. Nada disso é prometido.
 * - Serifada só em h1 e nos h2 das seções. Monoespaçada só em dado de
 *   verdade (hora, valor, data), dentro das telas.
 * - Uma faixa escura na página inteira, na seção da operação espalhada.
 *   O caderno aparece ali, uma vez só, e nunca no início.
 */

const CTA_LABEL = "Testar grátis";
const RISK_LINE = `${TRIAL_DAYS} dias com todos os recursos liberados. Sem cartão de crédito.`;

/**
 * Fatos que a leitora confere sozinha na primeira sessão de uso.
 *
 * "Profissionais e pacientes ilimitados" entrou aqui porque, com preço
 * público, a primeira dúvida deixa de ser "quanto custa" e passa a ser
 * "quanto vai custar quando eu crescer".
 */
const TRUST = [
  "Profissionais e pacientes ilimitados",
  "Anamnese e termo assinados pela paciente",
  "Fotos de evolução em armazenamento privado",
  "Abre no celular e instala como aplicativo",
];

/** O que só existe porque o sistema é de estética. Cada linha tem tela
 *  correspondente no produto. */
const FOR_AESTHETICS = [
  {
    icon: ClipboardCheck,
    title: "Anamnese por procedimento",
    text: "Você monta o questionário de cada procedimento e envia por link. A paciente responde no celular dela.",
  },
  {
    icon: PenLine,
    title: "Termo assinado na tela",
    text: "O termo de consentimento é assinado com o dedo e fica guardado no cadastro, com data e hora.",
  },
  {
    icon: Camera,
    title: "Fotos de antes e depois",
    text: "Cada sessão guarda as próprias fotos, na ordem, junto da anotação de evolução daquele dia.",
  },
  {
    icon: CalendarClock,
    title: "Pacotes de sessões",
    text: "Sessão 4 de 10 fica registrada como sessão 4 de 10, com assinatura da paciente a cada atendimento. Ninguém precisa contar de cabeça quantas ainda faltam.",
  },
  {
    icon: Percent,
    title: "Comissão do jeito que a estética paga",
    text: "Percentual ou valor fixo, por profissional, por procedimento ou pelos dois ao mesmo tempo. O relatório do mês já traz o valor de cada uma.",
  },
  {
    icon: PackageSearch,
    title: "Estoque com validade",
    text: "O alerta olha a quantidade mínima e a data de validade, porque em estética o produto vence antes de acabar.",
  },
];

/** Recursos agrupados pelo momento da clínica em que são usados. Uma
 *  nuvem de chips repetindo isso tudo não dizia nada; o agrupamento diz
 *  onde cada coisa entra no dia. */
const FEATURE_GROUPS = [
  {
    context: "No atendimento",
    items: [
      "Agenda por profissional",
      "Prontuário da paciente",
      "Anamnese digital",
      "Termo de consentimento",
      "Fotos de evolução",
      "Pacotes e sessões",
    ],
  },
  {
    context: "No comercial",
    items: [
      "CRM de leads por estágio",
      "Origem de cada lead",
      "Orçamentos em PDF",
      "Vendas",
      "Recibo com a marca da clínica",
      "Lista de quem parou de vir",
    ],
  },
  {
    context: "Na gestão",
    items: [
      "Contas a pagar e a receber",
      "Comissões por profissional",
      "Estoque com mínimo e validade",
      "Meta do mês",
      "Relatórios com filtro e exportação",
      "Usuários e permissões",
    ],
  },
];

const DATA_CARDS = [
  {
    icon: FileSpreadsheet,
    title: "Traga a base que você já tem",
    text: "Importe pacientes, procedimentos, agenda e lançamentos financeiros de uma planilha em Excel ou CSV. Telefone e CPF entram com ou sem máscara, a data vale nos dois formatos, e no fim aparece linha por linha o que entrou e o que ficou de fora.",
  },
  {
    icon: Lock,
    title: "Cada clínica enxerga só a si mesma",
    text: "O isolamento entre clínicas é regra no banco de dados, não filtro de tela. As fotos de prontuário ficam num armazenamento privado, que abre só para quem tem permissão na sua clínica.",
  },
  {
    icon: Download,
    title: "A saída também é sua",
    text: "Exporte pacientes, procedimentos, agenda, lançamentos financeiros e os relatórios em Excel ou CSV, na hora que você quiser.",
  },
];

const STEPS = [
  {
    title: "Crie a conta da clínica",
    text: "Seus dados, o nome da clínica e uma senha. Você confirma o e-mail e o teste começa.",
  },
  {
    title: "Traga sua base ou comece do zero",
    text: "Importe de uma planilha em Configurações, ou cadastre a primeira paciente direto na tela.",
  },
  {
    title: "Chame sua equipe",
    text: "Convide cada pessoa e escolha o que ela pode ver e o que pode editar.",
  },
];

export const FAQ = [
  {
    question: "Quanto custa o EstéticaOS?",
    answer: `O plano completo custa ${formatPrice(PLAN_MONTHLY_PRICE_CENTS)} por mês. No anual, fica ${formatPrice(PLAN_YEARLY_PRICE_CENTS)} por ano, equivalente a ${formatPrice(PLAN_YEARLY_EQUIVALENT_CENTS)} por mês. O plano inclui profissionais e pacientes ilimitados.`,
  },
  {
    question: "Preciso colocar cartão para testar?",
    answer: `Não. O teste dura ${TRIAL_DAYS} dias e não pede cartão. Quando o teste terminar, o acesso ao sistema fica pausado até a ativação do plano.`,
  },
  {
    question: "O que acontece quando o teste termina?",
    answer:
      "Os dados da clínica continuam guardados, mas o acesso às áreas internas fica bloqueado até a ativação do plano.",
  },
  {
    question: "Tem limite de profissionais ou pacientes?",
    answer:
      "Não. O EstéticaOS tem profissionais e pacientes ilimitados no plano completo.",
  },
  {
    question: "Como faço para pagar?",
    answer:
      "Pelo Pix ou por cartão de crédito com renovação automática. A ativação é feita na tela Plano, dentro do sistema, depois que você cria a conta.",
  },
  {
    question: "Já uso outro sistema. Consigo trazer meus dados?",
    answer:
      "Sim. Exporte de onde você está hoje em Excel ou CSV e importe em Configurações, na aba Importação e exportação. O sistema aceita telefone e CPF com ou sem máscara, entende data nos dois formatos e mostra, linha por linha, o que entrou e o motivo do que ficou de fora.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Funciona. É um site que abre em qualquer navegador e pode ser instalado na tela inicial do celular como aplicativo, no Android e no iPhone.",
  },
  {
    question: "Como ficam os dados das minhas pacientes?",
    answer:
      "Cada clínica só enxerga os próprios dados, e esse isolamento é regra no banco, não filtro de tela. As fotos de prontuário ficam em armazenamento privado, liberado só para quem tem permissão na sua clínica.",
  },
];

/** Rótulo de seção. Sem caixa alta, sem monoespaçada e sem tracking
 *  esticado: era a mesma etiqueta em cima de tudo e virou ruído. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-primary">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 max-w-2xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
      {children}
    </h2>
  );
}

/** O botão principal. Altura fixa de 44px porque o `size` padrão do
 *  sistema é feito para o painel, onde tudo é mais compacto, e aqui o
 *  alvo precisa dar conta do dedo no celular. */
function CtaButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={variant}
      className="h-11 px-5 text-[0.9375rem]"
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:gap-6 md:px-6">
          {/* Abaixo de 400px o nome por extenso não cabe junto com
              Entrar e o botão principal, e o botão é o que não pode
              sair. A marca sozinha continua sendo o link para o início. */}
          <Link
            href="/"
            aria-label="EstéticaOS, ir para o início"
            className="flex h-11 items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Logo markClassName="size-6 sm:size-7" wordmarkClassName="hidden text-lg sm:inline sm:text-xl" />
          </Link>

          <nav aria-label="Seções da página" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-6 text-sm">
              {[
                { href: "#por-dentro", label: "Por dentro" },
                { href: "#preco", label: "Preço" },
                { href: "#perguntas", label: "Perguntas" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex min-h-11 items-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
            <ThemeToggle className="size-11" />
            <Button
              variant="ghost"
              className="h-11 px-2.5 sm:px-3"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Entrar
            </Button>
            <Button
              className="h-11 px-3.5 text-sm sm:px-5 sm:text-[0.9375rem]"
              nativeButton={false}
              render={<Link href="/cadastro" />}
            >
              {CTA_LABEL}
            </Button>
          </div>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {/* ============================================================
            HERÓI. A coluna de texto vem primeiro no DOM, então no
            celular a leitora lê a proposta antes de ver a demonstração. */}
        <section className="px-4 pt-12 pb-16 md:px-6 md:pt-16">
          <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-14">
            <div className="lg:pt-6">
              <Eyebrow>Gestão para clínicas de estética</Eyebrow>

              <h1 className="mt-3 font-heading text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
                Sua clínica inteira em um sistema feito só para estética.
              </h1>

              <p className="mt-5 text-base text-muted-foreground sm:text-lg">
                Agenda, prontuário, fotos de evolução, anamnese, CRM, financeiro, comissões e
                estoque no mesmo lugar. Tudo acompanha a rotina da clínica, do primeiro contato ao
                pós-atendimento.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <CtaButton href="/cadastro">{CTA_LABEL}</CtaButton>
                <Button
                  variant="outline"
                  className="h-11 px-5 text-[0.9375rem]"
                  nativeButton={false}
                  render={<a href="#por-dentro" />}
                >
                  Ver o sistema por dentro
                </Button>
              </div>

              <p className="mt-4 text-base text-muted-foreground sm:text-sm">{RISK_LINE}</p>
            </div>

            <ClinicJourney />
          </div>
        </section>

        {/* ============================================================
            Faixa de confiança. Só o que a leitora confere sozinha na
            primeira sessão. */}
        <section
          aria-label="O que o sistema já faz"
          className="border-y border-border/70 bg-muted/30 px-4 py-6 md:px-6"
        >
          {/* Grade em vez de linha que quebra: com quatro itens a quebra
              deixava um sozinho e centralizado, parecendo sobra. */}
          <ul className="mx-auto grid max-w-6xl gap-x-8 gap-y-3 text-base text-muted-foreground sm:grid-cols-2 sm:text-sm lg:grid-cols-4">
            {TRUST.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ============================================================
            Três benefícios, com hierarquia: o primeiro ocupa a linha
            inteira porque é o que muda mais o dia. */}
        <section className="px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Na prática</Eyebrow>
            <SectionTitle>O que muda na sua semana</SectionTitle>

            <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              <div className="md:col-span-2 md:max-w-3xl">
                <h3 className="font-sans text-xl font-semibold">Você para de procurar informação</h3>
                <p className="mt-2 text-muted-foreground">
                  Agenda, prontuário, orçamento e pagamento da mesma paciente ficam no mesmo
                  cadastro. Quando ela pergunta o que foi aplicado em maio, a resposta está na tela,
                  com a foto daquela sessão do lado.
                </p>
              </div>

              <div>
                <h3 className="font-sans text-lg font-semibold">O mês passa a ter número</h3>
                <p className="mt-2 text-muted-foreground">
                  Faturamento por profissional, contas a receber, comissões e a meta do mês, em
                  relatórios que você filtra por período e exporta quando precisar levar para o
                  contador.
                </p>
              </div>

              <div>
                <h3 className="font-sans text-lg font-semibold">Cada pessoa vê só o que precisa</h3>
                <p className="mt-2 text-muted-foreground">
                  Você define a permissão de cada usuário, uma a uma. A recepção marca horário sem
                  enxergar o caixa, e quem cuida do financeiro vê comissão sem abrir prontuário.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            A diferenciação. Aqui a página responde "por que não um
            sistema qualquer", sem falar do sistema de ninguém. */}
        <section className="border-t border-border/70 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Feito para estética</Eyebrow>
            <SectionTitle>O que só acontece numa clínica de estética</SectionTitle>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Cada uma destas telas nasceu de um pedaço da rotina de uma clínica de estética.
            </p>

            <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {FOR_AESTHETICS.map((item) => (
                <div key={item.title}>
                  <item.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-sans font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-base text-muted-foreground sm:text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            A única faixa escura da página, e o único lugar onde o
            caderno aparece. Marrom fundo em vez do quase preto anterior:
            dá o respiro sem virar um bloco pesado no meio da leitura. */}
        <section className="bg-[oklch(0.29_0.022_45)] px-4 py-20 text-[oklch(0.94_0.012_75)] md:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-[oklch(0.8_0.09_85)]">Onde a informação está hoje</p>
            <h2 className="mt-2 max-w-3xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              A mesma paciente mora em quatro lugares que não se falam
            </h2>

            <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {[
                {
                  where: "No caderno",
                  what: "O horário de amanhã, escrito à mão, que só existe naquela página.",
                },
                {
                  where: "Na planilha",
                  what: "O quanto entrou no mês, dependendo de alguém lembrar de atualizar.",
                },
                {
                  where: "No WhatsApp",
                  what: "O orçamento que você mandou e a conversa que parou no meio.",
                },
                {
                  where: "Num sistema genérico",
                  what: "O cadastro da paciente, sem anamnese, sem foto de evolução e sem comissão.",
                },
              ].map((item) => (
                <div key={item.where} className="border-t border-white/15 pt-4">
                  <p className="font-medium">{item.where}</p>
                  <p className="mt-1 text-base text-[oklch(0.78_0.015_60)] sm:text-sm">{item.what}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl font-heading text-xl leading-snug sm:text-2xl">
              Juntar esses quatro lugares vira um trabalho à parte, que costuma sobrar para o fim do
              dia. No EstéticaOS, tudo isso fica num cadastro só.
            </p>
          </div>
        </section>

        {/* ============================================================
            Por dentro: a tela que a dona abre toda manhã, e a lista de
            recursos agrupada pelo momento em que cada um é usado. */}
        <section id="por-dentro" className="scroll-mt-20 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Por dentro</Eyebrow>
            <SectionTitle>A tela que abre toda manhã</SectionTitle>

            {/* `min-w-0` nas duas colunas: item de grade não encolhe
                abaixo do próprio conteúdo mínimo, e a tela recriada tem
                linhas que não quebram. Sem isso a coluna estica e a
                página inteira ganha rolagem lateral em telas de 320px. */}
            <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,24rem)]">
              <div className="min-w-0 lg:order-2">
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="h-[22rem]">
                    <HojeScreen />
                  </div>
                </div>
              </div>

              <div className="min-w-0 lg:order-1">
                <p className="text-muted-foreground">
                  A meta do mês, quantas pessoas vêm hoje, quanto ainda tem para entrar e quem
                  precisa de atenção. O aviso de estoque e o de lead parado chegam antes de virarem
                  problema, e cada número leva para a tela onde ele mora.
                </p>
                {/* Lista aninhada de verdade em vez de uma frase com
                    pontos no meio: o leitor de tela anuncia quantos
                    recursos são e lê item por item, em vez de despejar
                    tudo como um parágrafo só. */}
                <dl className="mt-6 space-y-4">
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.context}>
                      <dt className="text-sm font-semibold">{group.context}</dt>
                      <dd>
                        <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-base text-muted-foreground sm:text-sm">
                          {group.items.map((item, index) => (
                            <li key={item}>
                              {item}
                              {index < group.items.length - 1 && (
                                <span className="ml-2 text-muted-foreground/50" aria-hidden>
                                  ·
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            Migração, isolamento e propriedade dos dados. As três
            objeções de quem já tem base montada em outro lugar. */}
        <section className="border-t border-border/70 bg-muted/30 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Seus dados</Eyebrow>
            <SectionTitle>
              Seus dados entram fáceis, ficam separados e saem quando você quiser
            </SectionTitle>

            <div className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-3">
              {DATA_CARDS.map((card) => (
                <div key={card.title}>
                  <card.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-sans font-semibold">{card.title}</h3>
                  <p className="mt-1.5 text-base text-muted-foreground sm:text-sm">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            Como começar. Sem promessa de minutos: ninguém cronometrou. */}
        <section id="comecar" className="scroll-mt-20 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Eyebrow>Como começar</Eyebrow>
            <SectionTitle>Três passos até a primeira paciente cadastrada</SectionTitle>

            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t-2 border-primary pt-4">
                  <span className="font-mono text-sm tabular-nums text-primary">{index + 1}</span>
                  <h3 className="mt-1 font-sans font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-base text-muted-foreground sm:text-sm">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================================
            O preço, dito inteiro e sem asterisco. Vem antes do FAQ
            porque é a pergunta que trava a decisão.

            Um card só, porque existe um plano só. Nada de três colunas
            fingindo escolha quando a escolha real é mensal ou anual. */}
        <section id="preco" className="scroll-mt-20 border-t border-border/70 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Eyebrow>Preço</Eyebrow>
            <SectionTitle>Um plano só. Sem surpresa quando a clínica cresce.</SectionTitle>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Use agenda, prontuário, anamnese, termos, fotos de evolução, CRM, financeiro,
              comissões, estoque e relatórios em uma única assinatura. Profissionais e pacientes
              ilimitados.
            </p>

            <div className="mt-12 overflow-hidden rounded-2xl border border-border">
              <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
                {/* Coluna do preço. Primeira no DOM, então no celular a
                    leitora vê quanto custa antes da lista. */}
                <div className="border-b border-border bg-muted/40 p-6 sm:p-8 lg:border-r lg:border-b-0">
                  <p className="font-medium">{PLAN_NAME}</p>

                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-heading text-5xl font-semibold tracking-tight">
                      {formatPrice(PLAN_MONTHLY_PRICE_CENTS)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </p>

                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-medium">
                      {formatPrice(PLAN_YEARLY_EQUIVALENT_CENTS)}/mês, pago anualmente
                    </p>
                    {/* Sans, não mono: as duas linhas da caixa são frase,
                        não coluna de dado. A monoespaçada da página fica
                        reservada para hora, valor e data dentro das
                        telas recriadas do sistema. */}
                    <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                      {formatPrice(PLAN_YEARLY_PRICE_CENTS)} por ano
                    </p>
                    <p className="mt-2 inline-block rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.42_0.08_150)] dark:text-sage">
                      Economize {formatPrice(PLAN_YEARLY_SAVINGS_CENTS)} por ano
                    </p>
                  </div>

                  <div className="mt-6">
                    <CtaButton href="/cadastro">{CTA_LABEL}</CtaButton>
                  </div>

                  <p className="mt-3 text-base text-muted-foreground sm:text-sm">
                    {TRIAL_DAYS} dias grátis, sem cartão de crédito.
                  </p>
                </div>

                {/* Coluna do que vem junto. */}
                <div className="p-6 sm:p-8">
                  <p className="text-sm font-medium">O que está incluído</p>
                  <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                    {PLAN_FEATURES.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-base sm:text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-7 border-t border-border pt-5 text-base text-muted-foreground sm:text-sm">
                    Teste por {TRIAL_DAYS} dias. Se fizer sentido para a sua rotina, ative o plano no
                    Pix ou cartão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        <section id="perguntas" className="scroll-mt-20 border-t border-border/70 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>Perguntas</Eyebrow>
            <SectionTitle>O que perguntam antes de começar</SectionTitle>

            <div className="mt-10">
              <Accordion>
                {FAQ.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger className="min-h-11 text-left text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="pb-2 text-base text-muted-foreground sm:text-sm">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <p className="mt-8 text-base text-muted-foreground sm:text-sm">
              Ficou outra dúvida?{" "}
              <a
                href={supportWhatsAppUrl("Tenho uma dúvida sobre o EstéticaOS.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Chame no WhatsApp
              </a>
              .
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        <section className="px-4 pb-24 md:px-6">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-muted/40 px-6 py-14 text-center sm:px-14">
            <LogoMark className="mx-auto size-10" />
            <h2 className="mx-auto mt-5 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              A sua clínica organizada do primeiro contato ao retorno
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Agenda, prontuário, financeiro e CRM num sistema feito só para estética. Crie a conta e
              veja como fica com o nome da sua clínica.
            </p>
            <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground sm:text-sm">{RISK_LINE}</p>
            <div className="mt-8 flex justify-center">
              <Button
                className="h-12 px-7 text-base"
                nativeButton={false}
                render={<Link href="/cadastro" />}
              >
                {CTA_LABEL}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Logo markClassName="size-5" wordmarkClassName="text-base" />
          <nav aria-label="Rodapé">
            <ul className="flex items-center gap-5 text-base text-muted-foreground sm:text-sm">
              <li>
                <Link
                  href="/login"
                  className="flex min-h-11 items-center rounded outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="flex min-h-11 items-center rounded outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {CTA_LABEL}
                </Link>
              </li>
            </ul>
          </nav>
          <OrbyniqBadge className="items-center text-center sm:items-end sm:text-right" />
        </div>
      </footer>
    </div>
  );
}
