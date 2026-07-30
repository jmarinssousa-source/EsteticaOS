"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Package,
  Kanban,
  LineChart,
  MessageCircle,
  NotebookPen,
  Rocket,
  Search,
  Settings,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FAQ_CATEGORIES, FAQ_ENTRIES } from "@/lib/help/faq";
import { supportWhatsAppUrl } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");
}

/** Um ícone por assunto: quem não lê o painel inteiro reconhece o
 *  desenho da área que procura antes de ler o título. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Primeiros passos": Rocket,
  CRM: Kanban,
  "Pacientes e anamnese": Users,
  Agenda: CalendarDays,
  "Orçamentos e vendas": ClipboardList,
  "Sessões e assinaturas": Wrench,
  Prontuário: NotebookPen,
  Financeiro: Wallet,
  Estoque: Package,
  Relatórios: LineChart,
  "Configurações e permissões": Settings,
};

export function HelpPanel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return FAQ_ENTRIES;
    return FAQ_ENTRIES.filter((entry) => {
      const haystack = normalize(
        [entry.question, entry.category, ...(entry.keywords ?? []), ...entry.steps].join(" "),
      );
      return haystack.includes(term);
    });
  }, [query]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of FAQ_ENTRIES) {
      map.set(entry.category, (map.get(entry.category) ?? 0) + 1);
    }
    return map;
  }, []);

  // Buscando, mostra tudo que casou. Sem busca, mostra o assunto aberto —
  // e, se nenhum estiver aberto, o menu de assuntos.
  const visible = searching
    ? filtered
    : category
      ? FAQ_ENTRIES.filter((entry) => entry.category === category)
      : [];

  const groups = FAQ_CATEGORIES.map((name) => ({
    name,
    entries: visible.filter((entry) => entry.category === name),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Digite sua dúvida. Ex: como marcar horário"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {!searching && !category && (
          <>
            <p className="text-sm text-muted-foreground">
              Escolha um assunto abaixo ou escreva sua dúvida no campo de busca.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FAQ_CATEGORIES.map((name) => {
                const Icon = CATEGORY_ICONS[name] ?? Rocket;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className="text-sm font-medium leading-tight">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {counts.get(name) ?? 0} resposta{counts.get(name) === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">Não achou o que precisa?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fale direto com quem faz o sistema — sem robô e sem fila.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                nativeButton={false}
                render={
                  <a
                    href={supportWhatsAppUrl("Preciso de ajuda com o EstéticaOS.")}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <MessageCircle className="size-4" />
                Chamar no WhatsApp
              </Button>
            </div>
          </>
        )}

        {!searching && category && (
          <Button size="sm" variant="ghost" onClick={() => setCategory(null)}>
            <ArrowLeft className="size-4" />
            Todos os assuntos
          </Button>
        )}

        {searching && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma resposta com essa palavra. Tente o nome do menu — agenda, financeiro, paciente,
            comissão — ou{" "}
            <button
              type="button"
              onClick={() => setQuery("")}
              className="underline underline-offset-2 hover:text-foreground"
            >
              volte para a lista de assuntos
            </button>
            .
          </p>
        )}

        {groups.map((group) => {
          const Icon = CATEGORY_ICONS[group.name] ?? Rocket;
          return (
            <div key={group.name} className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
                {group.name}
              </h3>
              <Accordion>
                {group.entries.map((entry) => (
                  <AccordionItem key={entry.id} value={entry.id}>
                    <AccordionTrigger className="text-left text-sm">
                      {entry.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                        {entry.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })}
      </div>
    </div>
  );
}
