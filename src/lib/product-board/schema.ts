/**
 * Product Board block schema.
 *
 * The board is data, not JSX. Every visible thing on the page is a block with a
 * `type`, and each type has exactly one renderer that knows how to both display
 * and edit it. Adding a card is a data change, not a code change.
 *
 * Block `title`s are headings and are intentionally NOT editable in the UI —
 * they are the board's stable vocabulary. Everything inside a block is editable.
 */

/** How trustworthy is this block's content? Shown as a chip in the block header. */
export type Confidence = "assumption" | "validated" | "decided";

/** Column span on the 6-column board grid. */
export type BlockSize = "third" | "half" | "two-thirds" | "full";

/**
 * Visual tier. The single biggest lever on how the page reads:
 * - `hero`  — large type on a gradient, for the handful of statements that matter
 * - `card`  — bordered tile, for primary evidence
 * - `plain` — no border, sits directly on the page, for supporting detail
 */
export type BlockEmphasis = "hero" | "card" | "plain";

type BlockBase = {
  id: string;
  /** Heading. Not user-editable by design. */
  title: string;
  size: BlockSize;
  emphasis: BlockEmphasis;
  confidence?: Confidence;
  /** Shown in "Summary" density. Leave false for supporting detail. */
  inSummary?: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

/** Prose: exec summary, vision, mission, value prop, positioning. */
export type StatementBlock = BlockBase & {
  type: "statement";
  body: string;
  accent?: "indigo" | "emerald" | "violet" | "slate";
};

/** Label/value pairs: KPIs, unit economics, firmographics. */
export type MetricsBlock = BlockBase & {
  type: "metrics";
  items: { id: string; label: string; value: string }[];
};

/** Bullets, optionally checkable: JTBD, gaps, dependencies, launch checklist. */
export type ListBlock = BlockBase & {
  type: "list";
  checkable?: boolean;
  items: { id: string; text: string; done?: boolean }[];
};

/**
 * Repeated records — the workhorse. Pain points, competitors, personas,
 * features, risks and projections are all structurally this: a titled record
 * with some badge-able fields and some prose fields.
 */
export type RecordsBlock = BlockBase & {
  type: "records";
  columns: number;
  fields: RecordField[];
  items: { id: string; values: Record<string, string> }[];
};

export type RecordField = {
  key: string;
  label: string;
  /** `title` renders as the record heading, `badge` as a chip, `text` as prose. */
  kind: "title" | "badge" | "text";
};

/** Phased work with milestones. */
export type TimelineBlock = BlockBase & {
  type: "timeline";
  items: {
    id: string;
    label: string;
    meta: string;
    bullets: string[];
    note: string;
  }[];
};

/** Numeric series, editable as a small table under the chart. */
export type ChartBlock = BlockBase & {
  type: "chart";
  variant: "area" | "bar" | "radar";
  caption: string;
  /** Y-axis / tooltip formatting hint. */
  unit?: "currency-m" | "plain";
  series: { key: string; label: string; color: string }[];
  rows: { id: string; label: string; values: Record<string, number> }[];
};

export type Block =
  | StatementBlock
  | MetricsBlock
  | ListBlock
  | RecordsBlock
  | TimelineBlock
  | ChartBlock;

export type BlockType = Block["type"];

export type Section = {
  id: string;
  /** Heading. Not user-editable by design. */
  title: string;
  /** Editable one-line framing for the section. */
  summary: string;
  blocks: Block[];
};

export type Board = {
  id: string;
  productName: string;
  status: string;
  /** The 4-6 numbers worth seeing before you scroll. */
  headline: { id: string; label: string; value: string }[];
  sections: Section[];
  updatedAt: string;
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  assumption: "Assumption",
  validated: "Validated",
  decided: "Decided",
};

/** Tailwind classes per confidence level, kept here so chips stay consistent. */
export const CONFIDENCE_STYLE: Record<Confidence, string> = {
  assumption:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  validated:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  decided:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

export const SIZE_CLASS: Record<BlockSize, string> = {
  third: "lg:col-span-2",
  half: "lg:col-span-3",
  "two-thirds": "lg:col-span-4",
  full: "lg:col-span-6",
};

/** Badge intent derived from the value itself, so seed data stays declarative. */
export function badgeTone(value: string): "high" | "medium" | "low" | "neutral" {
  const v = value.trim().toLowerCase();
  if (v === "high" || v === "p0") return "high";
  if (v === "medium" || v === "p1") return "medium";
  if (v === "low" || v === "p2") return "low";
  return "neutral";
}

/** Stable-ish id generator for blocks/items created in the browser. */
export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
