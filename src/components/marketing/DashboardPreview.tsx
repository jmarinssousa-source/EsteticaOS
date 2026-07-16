const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DEMO_PROGRESS = 0.82;

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md rotate-1 rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-primary/10 sm:rotate-2">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[oklch(0.72_0.14_25)]" />
        <span className="size-2.5 rounded-full bg-champagne" />
        <span className="size-2.5 rounded-full bg-sage" />
        <span className="ml-3 truncate text-xs text-muted-foreground">estetica-os.app/hoje</span>
      </div>

      <div className="flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
        <svg viewBox="0 0 100 100" className="size-20 shrink-0" role="img" aria-label="Meta do mês: 82%">
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
          <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--primary)">
            82%
          </text>
        </svg>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Meta do mês</p>
          <p className="truncate font-heading text-lg font-semibold">R$ 41.200</p>
          <p className="text-xs text-sage">Faltam R$ 8.800</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] text-muted-foreground">Agenda hoje</p>
          <p className="font-heading text-base font-semibold">12</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] text-muted-foreground">Leads pendentes</p>
          <p className="font-heading text-base font-semibold">4</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] text-muted-foreground">A receber</p>
          <p className="font-heading text-base font-semibold">R$ 3,6k</p>
        </div>
      </div>
    </div>
  );
}
