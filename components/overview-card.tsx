import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, SubCard } from "@/components/ui/card";

const toneStyles = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-rose-50 text-rose-700",
  warning: "bg-amber-50 text-amber-700"
};

type OverviewCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: keyof typeof toneStyles;
};

export function OverviewCard({ title, value, detail, icon: Icon, tone }: OverviewCardProps) {
  return (
    <Card as="article" className="interactive-card p-8 sm:p-9">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{title}</p>
          <p className="text-5xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="max-w-xl text-sm leading-7 text-slate-500">{detail}</p>
        </div>
        <SubCard className={cn("rounded-[24px] p-4 shadow-sm", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </SubCard>
      </div>
    </Card>
  );
}
