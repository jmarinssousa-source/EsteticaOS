import { Camera, Check, MessageCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recriações das telas reais do sistema, usadas como prova na página
 * pública. Cada uma corresponde a uma rota que existe de verdade — a
 * rota vai no rótulo da tela, para a leitora saber onde aquilo mora.
 *
 * Regras que valem para todas:
 *
 * - Nenhum dado real de paciente. Nomes, valores e datas são fictícios.
 * - Nada de moldura de navegador nem URL falsa: a página não ganha nada
 *   fingindo ser um print, e a moldura só roubava altura do conteúdo.
 * - Fonte monoespaçada só em dado de verdade (hora, valor, data), que é
 *   como o sistema mostra. Rótulo e texto corrido ficam em sans.
 * - Status nunca é indicado só por cor: vem sempre com a palavra junto,
 *   senão quem não distingue as cores fica sem a informação.
 *
 * São decorativas para leitor de tela — a trilha já anuncia a etapa e
 * descreve em texto o que cada tela mostra.
 */

export function Screen({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <p className="mb-3 shrink-0 text-[0.6875rem] font-medium text-muted-foreground">
        Tela <span className="font-mono text-foreground/70">{label}</span>
      </p>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Cartão interno: a superfície onde cada bloco da tela se apoia. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>{children}</div>
  );
}

/** Etiqueta de estado. A cor reforça, a palavra informa. */
function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" }) {
  const tones = {
    neutral: "border-border text-muted-foreground",
    ok: "border-sage/40 text-sage",
    warn: "border-champagne/50 text-[oklch(0.5_0.09_85)] dark:text-champagne",
  } as const;
  return (
    <span
      className={cn(
        // `inline-block` + `whitespace-nowrap` para a etiqueta não
        // quebrar no meio e deixar a borda arredondada partida em duas
        // linhas quando a coluna aperta no celular.
        "inline-block rounded-full border px-1.5 py-px text-[0.625rem] font-medium whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* A tela de abertura do sistema — /hoje                               */
/* ------------------------------------------------------------------ */

const GOAL_RADIUS = 40;
const GOAL_CIRCUMFERENCE = 2 * Math.PI * GOAL_RADIUS;
const GOAL_PROGRESS = 0.82;

const TILES = [
  { label: "Agenda do dia", value: "12" },
  { label: "Orçamentos em aberto", value: "5" },
  { label: "Contas a receber", value: "R$ 3.640" },
  { label: "Pacientes para reativar", value: "9" },
];

export function HojeScreen() {
  return (
    <Screen label="/hoje">
      <div className="flex flex-1 flex-col gap-2">
        <Panel className="flex items-center gap-4">
          <svg
            viewBox="0 0 100 100"
            className="size-14 shrink-0"
            role="img"
            aria-label="Meta do mês: 82 por cento"
          >
            <circle cx="50" cy="50" r={GOAL_RADIUS} fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={GOAL_RADIUS}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={GOAL_CIRCUMFERENCE}
              strokeDashoffset={GOAL_CIRCUMFERENCE * (1 - GOAL_PROGRESS)}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-[0.625rem] text-muted-foreground">Meta de agosto</p>
            <p className="truncate font-mono text-sm font-medium tabular-nums">
              R$ 41.200 <span className="text-muted-foreground">de R$ 50.000</span>
            </p>
            <p className="text-[0.625rem] text-muted-foreground">Faltam R$ 8.800</p>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-2">
          {TILES.map((tile) => (
            <Panel key={tile.label} className="py-2">
              <p className="truncate text-[0.625rem] text-muted-foreground">{tile.label}</p>
              <p className="font-mono text-sm font-medium tabular-nums">{tile.value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="mt-auto space-y-1.5 bg-muted/40">
          <p className="flex items-center gap-2 text-[0.6875rem]">
            <Tag tone="warn">Estoque</Tag>
            <span className="min-w-0 truncate text-muted-foreground">
              Ácido hialurônico vence em 12 dias
            </span>
          </p>
          <p className="flex items-center gap-2 text-[0.6875rem]">
            <Tag tone="warn">CRM</Tag>
            <span className="min-w-0 truncate text-muted-foreground">3 leads parados há mais de 5 dias</span>
          </p>
        </Panel>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Primeiro contato — /crm                                          */
/* ------------------------------------------------------------------ */

const FUNNEL: {
  stage: string;
  leads: { name: string; origin: string; value: string; stale?: boolean }[];
}[] = [
  {
    stage: "Novo lead",
    leads: [
      { name: "Sabrina Lopes", origin: "Instagram", value: "1.200" },
      { name: "Natália Reis", origin: "Indicação", value: "480" },
    ],
  },
  {
    stage: "Avaliação marcada",
    leads: [{ name: "Aline Vidal", origin: "Tráfego pago", value: "2.400", stale: true }],
  },
  {
    stage: "Orçamento enviado",
    leads: [{ name: "Kelly Rocha", origin: "WhatsApp", value: "3.150" }],
  },
];

export function CrmScreen() {
  return (
    <Screen label="/crm">
      {/* A terceira coluna sai no celular: com 320px de largura o título
          do estágio virava reticências e a coluna deixava de informar. */}
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
        {FUNNEL.map((column, index) => (
          <div
            key={column.stage}
            className={cn(
              "flex flex-col rounded-xl bg-muted/50 p-2",
              index === 2 && "hidden sm:flex",
            )}
          >
            <p className="mb-2 truncate text-[0.6875rem] font-medium text-muted-foreground">
              {column.stage}
            </p>
            <div className="space-y-1.5">
              {column.leads.map((lead) => (
                <div key={lead.name} className="rounded-lg border border-border bg-card p-2">
                  <p className="truncate text-xs font-medium">{lead.name}</p>
                  <p className="truncate text-[0.625rem] text-muted-foreground">{lead.origin}</p>
                  <p className="mt-1 font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                    R$ {lead.value}
                  </p>
                  {lead.stale && (
                    <p className="mt-1.5">
                      <Tag tone="warn">Parado há 6 dias</Tag>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Agenda — /agenda                                                 */
/* ------------------------------------------------------------------ */

/** Sem total em reais no rodapé: a agenda do sistema não soma o dia. */
const DAY = [
  {
    time: "09:00",
    patient: "Mariana Silva",
    procedure: "Limpeza de pele",
    pro: "Ana",
    status: "Confirmado",
  },
  {
    time: "10:15",
    patient: "Fernanda Santos",
    procedure: "Toxina botulínica",
    pro: "Ana",
    status: "Confirmado",
  },
  {
    time: "11:30",
    patient: "Juliana Almeida",
    procedure: "Preenchimento labial",
    pro: "Bia",
    status: "Agendado",
  },
  {
    time: "14:00",
    patient: "Carla Souza",
    procedure: "Drenagem linfática",
    pro: "Bia",
    status: "Agendado",
  },
];

export function AgendaScreen() {
  return (
    <Screen label="/agenda">
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="font-mono text-xs tabular-nums text-muted-foreground">Terça, 12/08</p>
          <p className="text-[0.6875rem] text-muted-foreground">Ana e Bia</p>
        </div>
        <ul className="space-y-1.5">
          {DAY.map((slot) => (
            <li
              key={slot.time}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-l-2 border-border bg-card px-3 py-2",
                slot.status === "Confirmado" ? "border-l-sage" : "border-l-primary",
              )}
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {slot.time}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{slot.patient}</span>
                <span className="block truncate text-[0.625rem] text-muted-foreground">
                  {slot.procedure} · {slot.pro}
                </span>
              </span>
              <Tag tone={slot.status === "Confirmado" ? "ok" : "neutral"}>{slot.status}</Tag>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Anamnese e termo — /pacientes/[id]/anamnese                      */
/* ------------------------------------------------------------------ */

const ANSWERS = [
  { question: "Usa ácido no rosto?", answer: "Sim, ácido salicílico à noite" },
  { question: "Alergia a anestésico?", answer: "Não" },
  { question: "Está gestante ou amamentando?", answer: "Não" },
];

export function AnamneseScreen() {
  return (
    <Screen label="/pacientes/:id/anamnese">
      <div className="flex flex-1 flex-col gap-2">
        <Panel className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium">Anamnese facial</p>
            <Tag tone="ok">Respondida</Tag>
          </div>
          <dl className="space-y-1.5">
            {ANSWERS.map((item) => (
              <div key={item.question}>
                <dt className="text-[0.625rem] text-muted-foreground">{item.question}</dt>
                <dd className="text-xs font-medium">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium">Termo de consentimento</p>
            <Tag tone="ok">
              <Check className="mr-0.5 inline size-2.5" aria-hidden />
              Assinado
            </Tag>
          </div>
          <div className="mt-2 flex items-end gap-2 border-t border-dashed border-border pt-2">
            <PenLine className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-heading text-sm italic text-foreground/70">Mariana Silva</span>
            <span className="ml-auto shrink-0 font-mono text-[0.625rem] tabular-nums text-muted-foreground">
              12/08 09:04
            </span>
          </div>
        </Panel>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Atendimento e evolução — /pacientes/[id]                         */
/* ------------------------------------------------------------------ */

/** Marcador de foto: retângulo neutro com a data. Não é rosto gerado
 *  nem banco de imagem — é o lugar onde a foto da paciente fica. */
function PhotoSlot({ caption }: { caption: string }) {
  return (
    <figure className="flex-1">
      <div className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-border bg-muted/60">
        <Camera className="size-4 text-muted-foreground/60" aria-hidden />
      </div>
      <figcaption className="mt-1 font-mono text-[0.625rem] tabular-nums text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

export function ProntuarioScreen() {
  return (
    <Screen label="/pacientes/:id">
      <div className="flex flex-1 flex-col gap-2">
        <Panel>
          <p className="mb-2 text-xs font-medium">Fotos de evolução</p>
          <div className="flex gap-2">
            <PhotoSlot caption="Antes · 12/06" />
            <PhotoSlot caption="Sessão 4 · 24/07" />
            <PhotoSlot caption="Sessão 8 · 12/08" />
          </div>
        </Panel>

        <Panel className="flex-1">
          <p className="mb-2 text-xs font-medium">Evolução</p>
          <div className="space-y-2">
            <div className="border-l-2 border-primary pl-2.5">
              <p className="font-mono text-[0.625rem] tabular-nums text-muted-foreground">12/08</p>
              <p className="text-xs">
                Sessão 8 de 10. Peeling superficial, sem intercorrência. Retorno em 21 dias.
              </p>
            </div>
            <div className="border-l-2 border-border pl-2.5">
              <p className="font-mono text-[0.625rem] tabular-nums text-muted-foreground">24/07</p>
              <p className="text-xs text-muted-foreground">
                Sessão 4 de 10. Leve vermelhidão, orientada sobre protetor solar.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Pagamento — /financeiro                                          */
/* ------------------------------------------------------------------ */

const ENTRIES = [
  { description: "Pacote facial · Mariana Silva", method: "Pix", amount: "1.800,00", status: "Recebido" },
  { description: "Toxina · Fernanda Santos", method: "Crédito 3x", amount: "950,00", status: "Recebido" },
  { description: "Preenchimento · Juliana Almeida", method: "Crédito 6x", amount: "1.400,00", status: "A receber" },
];

export function FinanceiroScreen() {
  return (
    <Screen label="/financeiro">
      <div className="flex flex-1 flex-col gap-2">
        <ul className="space-y-1.5">
          {ENTRIES.map((entry) => (
            <li
              key={entry.description}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{entry.description}</span>
                <span className="block truncate text-[0.625rem] text-muted-foreground">
                  {entry.method}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-xs font-medium tabular-nums">
                  R$ {entry.amount}
                </span>
                <Tag tone={entry.status === "Recebido" ? "ok" : "neutral"}>{entry.status}</Tag>
              </span>
            </li>
          ))}
        </ul>

        <Panel className="mt-auto bg-muted/40">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium">Recibo de Mariana Silva</p>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">PDF</span>
          </div>
          <p className="mt-1 text-[0.625rem] text-muted-foreground">
            Sai com o nome, o endereço e o CNPJ da sua clínica.
          </p>
        </Panel>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Retorno — /pacientes/reativacao                                  */
/* ------------------------------------------------------------------ */

const INACTIVE = [
  { name: "Renata Lopes", last: "Limpeza de pele", days: "94" },
  { name: "Patrícia Nunes", last: "Massagem modeladora", days: "121" },
  { name: "Vanessa Corrêa", last: "Peeling químico", days: "156" },
];

export function ReativacaoScreen() {
  return (
    <Screen label="/pacientes/reativacao">
      <div className="flex flex-1 flex-col">
        <p className="mb-2 text-[0.6875rem] text-muted-foreground">
          Sem voltar há mais de 90 dias
        </p>
        <ul className="space-y-1.5">
          {INACTIVE.map((patient) => (
            <li
              key={patient.name}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{patient.name}</span>
                <span className="block truncate text-[0.625rem] text-muted-foreground">
                  Último atendimento: {patient.last}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                {patient.days} dias
              </span>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
                <MessageCircle className="size-3" aria-hidden />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}
