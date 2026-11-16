import { cn } from "@/lib/utils";
import { CONFIDENCE_LABEL, type Confidence } from "@/lib/product-board/schema";

/**
 * A small state chip. Tones follow the Product Board's confidence colours, so
 * amber always means "not yet proven", emerald "proven" and sky "settled".
 */
export type PillTone = "warn" | "ok" | "info" | "bad" | "neutral";

const TONE_CLASS: Record<PillTone, string> = {
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  bad: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  neutral: "border-border bg-transparent text-muted-foreground",
};

const CONFIDENCE_TONE: Record<Confidence, PillTone> = {
  assumption: "warn",
  validated: "ok",
  decided: "info",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ConfidencePill({ confidence }: { confidence: Confidence }) {
  return <StatusPill tone={CONFIDENCE_TONE[confidence]}>{CONFIDENCE_LABEL[confidence]}</StatusPill>;
}

/** Dot + label, for tight spots such as the key-number tiles. */
export function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  const color: Record<Confidence, string> = {
    assumption: "text-amber-700 dark:text-amber-400",
    validated: "text-emerald-700 dark:text-emerald-400",
    decided: "text-sky-700 dark:text-sky-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", color[confidence])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}
