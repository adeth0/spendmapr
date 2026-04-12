import { cn } from "@/lib/utils";

const tones = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  brand: "bg-brand-500",
  danger: "bg-rose-500"
};

export function ProgressBar({
  value,
  tone = "brand"
}: {
  value: number;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="h-3 rounded-full bg-slate-200">
      <div
        className={cn("h-3 rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
