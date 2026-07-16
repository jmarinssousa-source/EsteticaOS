"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export function CashFlowChart({
  data,
}: {
  data: { label: string; pago: number; pendente: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatCurrency(value)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={70}
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
        />
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
        <Bar dataKey="pago" name="Pago/recebido" stackId="a" fill="var(--sage)" radius={[4, 0, 0, 4]} barSize={22} />
        <Bar
          dataKey="pendente"
          name="Pendente"
          stackId="a"
          fill="var(--champagne)"
          radius={[0, 4, 4, 0]}
          barSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
