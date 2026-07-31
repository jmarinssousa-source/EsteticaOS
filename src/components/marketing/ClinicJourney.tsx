"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AgendaScreen,
  AnamneseScreen,
  CrmScreen,
  FinanceiroScreen,
  ProntuarioScreen,
  ReativacaoScreen,
} from "@/components/marketing/JourneyScreens";

/**
 * A clínica em movimento — a assinatura visual da página.
 *
 * Em vez de um print solto do painel, o percurso de uma paciente do
 * primeiro contato ao retorno, etapa por etapa, cada uma abrindo a tela
 * do sistema onde aquilo acontece de verdade. É a única coisa animada
 * da página: um movimento que explica o produto em vez de enfeitar.
 *
 * A trilha é a borda superior dos próprios botões. As etapas já
 * percorridas ficam na cor de ação e as seguintes na cor de borda, então
 * o progresso é lido na linha, sem precisar de barra à parte.
 *
 * O rodízio automático para quando o ponteiro entra ou o teclado chega
 * na trilha (exigência do padrão de abas com rotação) e nem começa para
 * quem pediu menos movimento no sistema.
 */

const STEPS = [
  {
    id: "contato",
    label: "Primeiro contato",
    headline: "A mensagem vira lead com estágio e valor",
    detail:
      "Cada contato entra no funil com origem e valor estimado. Quem ficou dias sem resposta aparece marcado.",
    screen: <CrmScreen />,
  },
  {
    id: "agenda",
    label: "Agenda",
    headline: "O horário fica na agenda da profissional certa",
    detail:
      "O dia da clínica por profissional, com a situação de cada horário escrita ao lado: agendado, confirmado, compareceu.",
    screen: <AgendaScreen />,
  },
  {
    id: "anamnese",
    label: "Anamnese",
    headline: "A ficha chega respondida antes do atendimento",
    detail:
      "Você manda o link, a paciente responde no celular dela e assina o termo. Tudo fica salvo no cadastro.",
    screen: <AnamneseScreen />,
  },
  {
    id: "atendimento",
    label: "Atendimento",
    headline: "A evolução fica junto das fotos",
    detail:
      "Fotos de cada sessão e o que foi feito em cada uma, na ordem. Da próxima vez que ela perguntar, a resposta está ali.",
    screen: <ProntuarioScreen />,
  },
  {
    id: "pagamento",
    label: "Pagamento",
    headline: "O pagamento entra com forma e situação",
    detail:
      "Pix, crédito parcelado ou dinheiro, cada lançamento com o que já entrou e o que ainda vai entrar. O recibo sai em PDF.",
    screen: <FinanceiroScreen />,
  },
  {
    id: "retorno",
    label: "Retorno",
    headline: "Quem parou de vir aparece numa lista",
    detail:
      "As pacientes sem voltar há mais de 90 dias ficam separadas, com o último atendimento e o botão para chamar no WhatsApp.",
    screen: <ReativacaoScreen />,
  },
] as const;

const ROTATION_MS = 5000;

export function ClinicJourney({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const baseId = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused) return;
    // A preferência do sistema é lida aqui, e não no CSS, porque o que
    // precisa parar é o temporizador — não adianta só esconder a
    // transição se a tela continua trocando sozinha.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % STEPS.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const focusTab = useCallback((index: number) => {
    setActive(index);
    tabsRef.current[index]?.focus();
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    const last = STEPS.length - 1;
    if (event.key === "ArrowRight") focusTab(active === last ? 0 : active + 1);
    else if (event.key === "ArrowLeft") focusTab(active === 0 ? last : active - 1);
    else if (event.key === "Home") focusTab(0);
    else if (event.key === "End") focusTab(last);
    else return;
    event.preventDefault();
  }

  const step = STEPS[active];

  return (
    <div
      className={cn("flex flex-col gap-5", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* O palco. A altura mínima é do palco, não da tela, para o quadro
          não pular de tamanho a cada troca de etapa. Só a etapa ativa é
          montada: as outras não têm o que preservar de estado e assim
          não sobra nada escondido no caminho do leitor de tela.

          A legenda mora dentro do painel, junto da tela que ela explica,
          e troca junto com ela. */}
      <div className="flex min-h-[25rem] flex-col rounded-2xl border border-border bg-background p-4 sm:min-h-[27rem] sm:p-5">
        <div
          key={step.id}
          role="tabpanel"
          id={`${baseId}-panel-${step.id}`}
          aria-labelledby={`${baseId}-tab-${step.id}`}
          className="flex flex-1 flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
        >
          <div className="flex min-h-0 flex-1 flex-col">{step.screen}</div>
          <p className="text-base sm:text-sm">
            <span className="font-medium">{step.headline}. </span>
            <span className="text-muted-foreground">{step.detail}</span>
          </p>
        </div>
      </div>

      {/* A trilha. Na largura pequena vira grade de dois, porque seis
          etapas em linha só cabem espremendo o rótulo até sumir. */}
      <div
        role="tablist"
        aria-label="Etapas do atendimento, do primeiro contato ao retorno"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-x-3 gap-y-2 sm:flex sm:gap-0"
      >
        {STEPS.map((item, index) => {
          const reached = index <= active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabsRef.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={index === active}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "group relative min-h-11 border-t-2 pt-2.5 text-left text-sm transition-colors outline-none sm:flex-1 sm:pr-3",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                reached ? "border-primary" : "border-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 left-0 size-2 -translate-y-1/2 rounded-full transition-colors",
                  index === active
                    ? "bg-primary ring-3 ring-primary/20"
                    : reached
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
              <span
                className={cn(
                  "block font-medium transition-colors",
                  index === active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
