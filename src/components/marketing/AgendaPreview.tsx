import { BrowserFrame } from "@/components/marketing/BrowserFrame";

const DOT_COLORS: Record<string, string> = {
  clay: "bg-clay",
  sage: "bg-sage",
  champagne: "bg-champagne",
};

const SLOTS = [
  { time: "09:00", patient: "Mariana Silva", procedure: "Limpeza de pele", color: "clay" },
  { time: "10:15", patient: "Fernanda Santos", procedure: "Botox", color: "sage" },
  { time: "11:30", patient: "Juliana Almeida", procedure: "Preenchimento labial", color: "champagne" },
  { time: "14:00", patient: "Carla Souza", procedure: "Drenagem linfática", color: "clay" },
];

export function AgendaPreview() {
  return (
    <BrowserFrame path="/agenda">
      <div className="space-y-1.5">
        {SLOTS.map((slot) => (
          <div
            key={slot.time}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
          >
            <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">{slot.time}</span>
            <span className={`size-2 shrink-0 rounded-full ${DOT_COLORS[slot.color]}`} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{slot.patient}</p>
              <p className="truncate text-[11px] text-muted-foreground">{slot.procedure}</p>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
