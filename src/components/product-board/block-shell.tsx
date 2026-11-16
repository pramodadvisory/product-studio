"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_STYLE,
  type Block,
  type Confidence,
} from "@/lib/product-board/schema";
import { EditableText, useReadOnly } from "./editable";
import { Badge } from "@/components/ui/badge";

/**
 * The three visual tiers. This is the main lever on how the page reads.
 *
 * Every tier is a *contained* shape — nothing sits fully naked on the page
 * background. Blocks used to have a "plain" tier with no border at all, and
 * next to a bordered card in the same row that read as an inconsistency, not a
 * hierarchy. Now all three are boxed and differ by fill and weight instead:
 * hero (gradient, boldest) → card (solid border + tint, for primary evidence)
 * → plain (thin border, no fill, for supporting detail). The eye still gets a
 * hierarchy; it no longer looks like half the page forgot its styles.
 */

const HERO_PALETTE: Record<string, string[]> = {
  indigo: ["hsl(216, 30%, 10%)", "hsl(243, 25%, 30%)", "hsl(205, 20%, 35%)", "hsl(211, 20%, 13%)"],
  emerald: ["hsl(150, 40%, 8%)", "hsl(160, 35%, 18%)", "hsl(140, 30%, 14%)", "hsl(155, 40%, 10%)"],
  violet: ["hsl(270, 35%, 10%)", "hsl(280, 30%, 26%)", "hsl(250, 25%, 30%)", "hsl(265, 35%, 12%)"],
  slate: ["hsl(215, 20%, 12%)", "hsl(215, 15%, 26%)", "hsl(210, 12%, 32%)", "hsl(215, 20%, 14%)"],
};

/** Cycle order: least to most certain, then back around. */
const CONFIDENCE_CYCLE: Confidence[] = ["assumption", "validated", "decided"];

function nextConfidence(value: Confidence): Confidence {
  return CONFIDENCE_CYCLE[(CONFIDENCE_CYCLE.indexOf(value) + 1) % CONFIDENCE_CYCLE.length];
}

export function ConfidenceChip({
  value,
  onCycle,
}: {
  value: Confidence;
  onCycle?: () => void;
}) {
  if (!onCycle) {
    return (
      <Badge
        variant="outline"
        className={cn("text-[10px] uppercase tracking-wide", CONFIDENCE_STYLE[value])}
      >
        {CONFIDENCE_LABEL[value]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      render={
        <button type="button" onClick={onCycle} title="Click to change confidence" />
      }
      className={cn(
        "text-[10px] uppercase tracking-wide transition-opacity hover:opacity-75",
        CONFIDENCE_STYLE[value]
      )}
    >
      {CONFIDENCE_LABEL[value]}
    </Badge>
  );
}

/** Relative "edited 3m ago" label. Keeps provenance visible without a byline row. */
function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Block header. The title is deliberately not editable — titles are the
 * board's stable vocabulary, and letting them drift would make the rail
 * meaningless. The description right below it is fully editable: it's the
 * answer to "what is this block and why is it here".
 */
function BlockHeader({
  block,
  onLight,
  onDescriptionCommit,
  onConfidenceCommit,
}: {
  block: Block;
  onLight?: boolean;
  onDescriptionCommit: (next: string) => void;
  onConfidenceCommit: (next: Confidence) => void;
}) {
  const readOnly = useReadOnly();
  // "Edited 3m ago" would be wrong in a published copy, which doesn't change.
  const edited = readOnly ? null : relativeTime(block.updatedAt);

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={cn(
            "text-[14px] font-semibold uppercase tracking-[0.06em]",
            onLight ? "text-white/60" : "text-foreground/65"
          )}
        >
          {block.title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {edited ? (
            <span
              className={cn(
                "text-[10px] tabular-nums",
                onLight ? "text-white/40" : "text-foreground/45"
              )}
            >
              {edited}
            </span>
          ) : null}
          {block.confidence ? (
            <ConfidenceChip
              value={block.confidence}
              onCycle={readOnly ? undefined : () => onConfidenceCommit(nextConfidence(block.confidence!))}
            />
          ) : null}
        </div>
      </div>
      <EditableText
        label={`${block.title} description`}
        value={block.description ?? ""}
        placeholder="What is this block? Why is it here…"
        onCommit={onDescriptionCommit}
        className={cn(
          "mt-1 text-xs leading-snug",
          // Descriptions are user-edited content, so they get full-strength text —
          // white on the dark hero gradient, foreground (near-black) everywhere
          // else — never the dimmed muted-foreground previously used here.
          onLight ? "text-white/85" : "text-foreground"
        )}
      />
    </div>
  );
}

/**
 * Wraps a block's body in its tier chrome. Renderers only produce content and
 * never decide their own container, which is what keeps 40 blocks looking like
 * one system.
 */
export function BlockShell({
  block,
  onDescriptionCommit,
  onConfidenceCommit,
  children,
}: {
  block: Block;
  onDescriptionCommit: (next: string) => void;
  onConfidenceCommit: (next: Confidence) => void;
  children: React.ReactNode;
}) {
  // h-full on every tier's root: the grid row already stretches each block's
  // wrapper to the height of the tallest sibling (CSS Grid's default
  // align-items: stretch), but without h-full here the *visible* bordered box
  // only wrapped its own content — so shorter cards left dangling blank space
  // below a short border while a tall neighbor's border ran further down. That
  // mismatch was the "jagged" look; h-full makes every visible box in a row
  // bottom-align at the same height, like a normal, non-masonry grid.
  if (block.emphasis === "hero") {
    const accent = block.type === "statement" ? (block.accent ?? "indigo") : "indigo";
    return (
      <section className="relative isolate flex h-full min-h-[10rem] flex-col overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0 -z-10">
          <MeshGradient
            style={{ height: "100%", width: "100%" }}
            distortion={0.8}
            swirl={0.1}
            offsetX={0}
            offsetY={0}
            scale={1}
            rotation={0}
            speed={0.6}
            colors={HERO_PALETTE[accent] ?? HERO_PALETTE.indigo}
          />
        </div>
        <div className="flex flex-1 flex-col p-6 text-white">
          <BlockHeader
            block={block}
            onLight
            onDescriptionCommit={onDescriptionCommit}
            onConfidenceCommit={onConfidenceCommit}
          />
          <div className="flex-1">{children}</div>
        </div>
      </section>
    );
  }

  if (block.emphasis === "card") {
    return (
      <section className="flex h-full flex-col rounded-xl border bg-muted/50 p-5 transition-colors hover:border-foreground/20">
        <BlockHeader
          block={block}
          onDescriptionCommit={onDescriptionCommit}
          onConfidenceCommit={onConfidenceCommit}
        />
        <div className="flex-1">{children}</div>
      </section>
    );
  }

  // plain — same border weight as card, just no fill. The two used to differ in
  // both border opacity and background, which is what made one "card" look
  // deliberately lighter and the other look like it was simply missing styles.
  // Now the only difference is fill; the border is identical everywhere.
  return (
    <section className="flex h-full flex-col rounded-xl border bg-transparent p-4 transition-colors hover:border-foreground/20">
      <BlockHeader
        block={block}
        onDescriptionCommit={onDescriptionCommit}
        onConfidenceCommit={onConfidenceCommit}
      />
      <div className="flex-1">{children}</div>
    </section>
  );
}
