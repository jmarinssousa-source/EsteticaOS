import { BrowserFrame } from "@/components/marketing/BrowserFrame";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DEMO_PROGRESS = 0.82;

function StatTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-heading text-base font-semibold ${emphasis ? "text-champagne" : ""}`}>{value}</p>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <BrowserFrame path="/hoje">
      <p className="text-xs text-muted-foreground">Olá, Camila</p>
      <p className="font-heading text-sm font-semibold">Clínica Bella Estética</p>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
        <svg viewBox="0 0 100 100" className="size-16 shrink-0" role="img" aria-label="Meta do mês: 82%">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - DEMO_PROGRESS)}
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--primary)">
            82%
          </text>
        </svg>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Meta do mês</p>
          <p className="truncate font-heading text-lg font-semibold">R$ 41.200</p>
          <p className="text-xs text-sage">Faltam R$ 8.800</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Agenda hoje" value="12" />
        <StatTile label="Leads pendentes" value="4" />
        <StatTile label="A receber" value="R$ 3,6k" />
        <StatTile label="Estoque baixo" value="2" emphasis />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-champagne" />
        3 leads parados há mais de 5 dias
      </div>
    </BrowserFrame>
  );
}
