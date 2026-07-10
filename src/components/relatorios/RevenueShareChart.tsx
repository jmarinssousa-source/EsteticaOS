"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

// Fixed categorical order (validated for CVD separation, chroma floor and
// contrast against both light/dark surfaces — see globals.css --chart-cat-*).
// Never cycled: beyond 4 series, the tail folds into a single "Outros" slice.
const SLICE_COLORS = ["var(--chart-cat-1)", "var(--chart-cat-2)", "var(--chart-cat-3)", "var(--chart-cat-4)"];
const OTHER_COLOR = "var(--chart-cat-5)";

export function RevenueShareChart({
  data,
}: {
  data: { professionalId: string; name: string; amount: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const top = data.slice(0, 4);
  const rest = data.slice(4);
  const restAmount = rest.reduce((sum, d) => sum + d.amount, 0);

  const slices = [
    ...top.map((d, i) => ({ ...d, color: SLICE_COLORS[i] })),
    ...(restAmount > 0 ? [{ professionalId: "other", name: "Outros", amount: restAmount, color: OTHER_COLOR }] : []),
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width={140} height={140} className="shrink-0">
        <PieChart>
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={66}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {slices.map((entry) => (
              <Cell key={entry.professionalId} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full min-w-0 space-y-1.5">
        {slices.map((entry) => (
          <li key={entry.professionalId} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 font-medium text-muted-foreground">
              {total > 0 ? Math.round((entry.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
