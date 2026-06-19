import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BentoCardProps = {
  /** Card title, always rendered text-lg font-semibold */
  title: string;
  /** Required leading icon for a consistent header across all cards */
  icon: LucideIcon;
  /** Optional tailwind color class for the icon (e.g. "text-blue-600") */
  iconClassName?: string;
  /** Optional one-line description shown under the title */
  description?: string;
  /** Grid span + any extra classes for the outer tile */
  className?: string;
  children: React.ReactNode;
};

/**
 * Standardized bento tile used across Product Board tabs.
 * Every card shares the same shell, header layout (icon + title + optional
 * description), and title typography.
 */
export function BentoCard({
  title,
  icon: Icon,
  iconClassName,
  description,
  className,
  children,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/50 p-6 hover:shadow-md transition-shadow flex flex-col",
        className
      )}
    >
      <div className="flex items-start gap-2.5 mb-4">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconClassName ?? "text-muted-foreground")} />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
