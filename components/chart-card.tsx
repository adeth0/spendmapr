"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description: string;
  data: Array<{ month: string; total: number }>;
};

export function ChartCard({ title, description, data }: ChartCardProps) {
  return (
    <div className="panel p-8 sm:p-10">
      <div className="space-y-3">
        <h2 className="section-title">{title}</h2>
        <p className="section-copy">{description}</p>
      </div>

      <div className="mt-8 h-80 rounded-[28px] border border-slate-200/70 bg-slate-50 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#eceef1" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `GBP ${value}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
              contentStyle={{
                borderRadius: 18,
                border: "1px solid #e5e7eb",
                boxShadow: "0 20px 40px -24px rgba(15, 23, 42, 0.18)",
                backgroundColor: "rgba(255,255,255,0.96)"
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar dataKey="total" fill="#5b82f6" radius={[18, 18, 12, 12]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
