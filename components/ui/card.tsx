import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
  as?: "section" | "article" | "div";
}>;

export function Card({ className, children, as: Component = "section" }: CardProps) {
  return <Component className={cn("panel rounded-2xl shadow-soft", className)}>{children}</Component>;
}

export function SubCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface-muted", className)}>{children}</div>;
}
