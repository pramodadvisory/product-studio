import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The stage check: an empty ring until every question (or check) in a stage
 * is done, then a filled green circle with a tick. Used wherever a stage's
 * state is shown, so "green" means the same thing everywhere.
 */
export function CompletionMark({
  complete,
  size = "md",
  label,
  className,
}: {
  complete: boolean;
  size?: "sm" | "md" | "lg";
  /** Read by screen readers; omit when the surrounding text already says it. */
  label?: string;
  className?: string;
}) {
  const box = { sm: "size-4", md: "size-8", lg: "size-14" }[size];
  const icon = { sm: "size-3", md: "size-4.5", lg: "size-7" }[size];
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-colors",
        box,
        complete
          ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
          : "border-2 border-muted-foreground/25",
        className
      )}
    >
      {complete && <CheckIcon className={icon} strokeWidth={2.5} />}
    </span>
  );
}
