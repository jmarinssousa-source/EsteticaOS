import { cn } from "@/lib/utils";

/**
 * O dia da clínica — o objeto mais característico do mundo de quem vai
 * ler a página. Ocupa o lugar onde a maioria dos SaaS põe um print do
 * painel: aqui a prova é a agenda em si, com o total no rodapé, que é
 * justamente o que o caderno não sabe dizer.
 *
 * Horário e valor em fonte monoespaçada de propósito: alinham em coluna
 * e é assim que esses dados aparecem no sistema de verdade.
 */

type Slot =
  | { time: string; patient: string; procedure: string; price: string; pro: "ana" | "bia" }
  | { time: string; free: true };

const DAY: Slot[] = [
  { time: "09:00", patient: "Mariana Silva", procedure: "Limpeza de pele", price: "180", pro: "ana" },
  { time: "10:15", patient: "Fernanda Santos", procedure: "Toxina botulínica", price: "950", pro: "ana" },
  { time: "11:30", patient: "Juliana Almeida", procedure: "Preenchimento labial", price: "1.400", pro: "bia" },
  { time: "14:00", patient: "Carla Souza", procedure: "Drenagem linfática", price: "120", pro: "bia" },
  { time: "15:30", free: true },
  { time: "16:00", patient: "Renata Lopes", procedure: "Retorno", price: "—", pro: "bia" },
];

const PRO_DOT = {
  ana: "bg-primary",
  bia: "bg-sage",
} as const;

export function ClinicDay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-30px_oklch(0.3_0.05_40_/_45%)]",
        className,
      )}
    >
      <div className="flex items-baseline justify-between border-b border-border px-5 py-3.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Terça, 12 de agosto
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          <span className="inline-block size-1.5 translate-y-px rounded-full bg-primary" /> Ana
          <span className="ml-3 inline-block size-1.5 translate-y-px rounded-full bg-sage" /> Bia
        </p>
      </div>

      <ol>
        {DAY.map((slot) => (
          <li
            key={slot.time}
            className="flex items-center gap-4 border-b border-border/60 px-5 py-3 last:border-b-0"
          >
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{slot.time}</span>

            {"free" in slot ? (
              <span className="flex-1 text-sm text-muted-foreground/70">Horário livre</span>
            ) : (
              <>
                <span className={cn("size-1.5 shrink-0 rounded-full", PRO_DOT[slot.pro])} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{slot.patient}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {slot.procedure}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {slot.price === "—" ? "—" : `R$ ${slot.price}`}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {/* A linha que o caderno não tem. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/50 px-5 py-3.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          5 atendimentos · 1 horário livre
        </p>
        {/* `whitespace-nowrap` para o "R$" não descolar do valor quando a
            linha quebra no celular. */}
        <p className="font-mono text-sm font-semibold whitespace-nowrap tabular-nums">R$ 2.650</p>
      </div>
    </div>
  );
}
