"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Inline editing primitives.
 *
 * Every editable field keeps its keystrokes in local state and only *commits*
 * upward on idle (400ms) or blur. Without this, every character would clone and
 * re-render the whole board document.
 *
 * Callers must pass their own typography classes — these controls only reset the
 * browser's form-control font family so the field visually matches surrounding
 * text rather than looking like an input.
 */
const COMMIT_DEBOUNCE_MS = 400;

const FIELD_BASE =
  "w-full bg-transparent border-0 p-0 m-0 outline-none [font-family:inherit] " +
  "rounded-sm transition-colors hover:bg-foreground/[0.04] " +
  "focus:bg-foreground/[0.06] focus:ring-1 focus:ring-ring/40 " +
  "placeholder:text-muted-foreground/50";

type CommitProps = {
  value: string;
  onCommit: (next: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
};

/** Shared local-draft + debounced-commit behaviour. */
function useDraft(value: string, onCommit: (next: string) => void) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);

  // Kept in a ref so the debounce effect below doesn't re-arm on every render
  // just because the parent passed a fresh callback identity.
  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  // Adopt changes that came from outside this field (initial load, reset).
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === committed.current) return;
    const t = setTimeout(() => {
      committed.current = draft;
      commitRef.current(draft);
    }, COMMIT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft]);

  const commitNow = () => {
    if (draft === committed.current) return;
    committed.current = draft;
    commitRef.current(draft);
  };

  return { draft, setDraft, commitNow };
}

/** Multi-line text that grows with its content. Use for prose. */
export function EditableText({
  value,
  onCommit,
  label,
  placeholder,
  className,
}: CommitProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { draft, setDraft, commitNow } = useDraft(value, onCommit);

  // Autosize: textareas have no intrinsic content height.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitNow}
      className={cn(FIELD_BASE, "resize-none overflow-hidden block", className ?? "text-sm")}
    />
  );
}

/** Single-line text. Enter commits and blurs rather than inserting a newline. */
export function EditableLine({
  value,
  onCommit,
  label,
  placeholder,
  className,
}: CommitProps) {
  const { draft, setDraft, commitNow } = useDraft(value, onCommit);

  return (
    <input
      type="text"
      aria-label={label}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitNow}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitNow();
          e.currentTarget.blur();
        }
      }}
      className={cn(FIELD_BASE, "truncate", className ?? "text-sm")}
    />
  );
}

/** Numeric field for chart data. Commits a number, never NaN. */
export function EditableNumber({
  value,
  onCommit,
  label,
  className,
}: {
  value: number;
  onCommit: (next: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <EditableLine
      label={label}
      value={String(value)}
      className={cn("text-right tabular-nums", className)}
      onCommit={(next) => {
        const parsed = Number(next.replace(/,/g, "").trim());
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
    />
  );
}

/**
 * Badge-shaped editable field. Sizes itself to its content so the pill hugs the
 * text instead of stretching to the container.
 */
export function EditableChip({
  value,
  onCommit,
  label,
  tone = "neutral",
}: CommitProps & { tone?: "high" | "medium" | "low" | "neutral" }) {
  const TONE: Record<string, string> = {
    high: "border-destructive/30 bg-destructive/10 text-destructive",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    neutral: "border-border bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn("h-auto py-0.5", TONE[tone])}
      style={{ width: `calc(${Math.max(3, value.length)}ch + 1.5rem)` }}
    >
      <EditableLine
        value={value}
        onCommit={onCommit}
        label={label}
        className="text-xs font-medium text-center"
      />
    </Badge>
  );
}

/** Destructive row control. Hidden until the row is hovered or focused. */
export function RemoveButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "shrink-0 rounded-sm p-0.5 text-muted-foreground/50 opacity-0 transition",
        "hover:bg-destructive/10 hover:text-destructive",
        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
        "group-hover/row:opacity-100",
        className
      )}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

/** Low-key add control that sits at the end of a list of editable rows. */
export function AddButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium",
        "text-muted-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
        className
      )}
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
