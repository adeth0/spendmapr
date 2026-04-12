import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatCardProps = PropsWithChildren<{
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}>;

export function StatCard({
  label,
  value,
  description,
  className,
  children
}: StatCardProps) {
  return (
    <Card className={cn("p-6 sm:p-7", className)}>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      {children}
    </Card>
  );
}
