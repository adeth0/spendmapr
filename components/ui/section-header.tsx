import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 className={cn("section-title", titleClassName)}>{title}</h2>
      {description ? (
        <p className={cn("section-copy", descriptionClassName)}>{description}</p>
      ) : null}
    </div>
  );
}
