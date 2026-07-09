"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FAQ_CATEGORIES, FAQ_ENTRIES } from "@/lib/help/faq";
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

export function HelpPanel() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return FAQ_ENTRIES;
    return FAQ_ENTRIES.filter((entry) => {
      const haystack = normalize(
        [entry.question, entry.category, ...(entry.keywords ?? [])].join(" "),
      );
      return haystack.includes(term);
    });
  }, [query]);

  const byCategory = FAQ_CATEGORIES.map((category) => ({
    category,
    entries: filtered.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar: ex. como criar orçamento"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {byCategory.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma resposta encontrada. Tente outra palavra, como o nome do menu (ex: agenda,
            financeiro, comissão).
          </p>
        )}

        {byCategory.map((group) => (
          <div key={group.category} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.category}
            </h3>
            <Accordion>
              {group.entries.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="text-left text-sm">{entry.question}</AccordionTrigger>
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
        ))}
      </div>
    </div>
  );
}
