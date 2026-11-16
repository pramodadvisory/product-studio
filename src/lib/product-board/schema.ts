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
 * Visual tier. The single biggest lever on how the page reads. All three are a
 * *contained* shape — nothing sits fully naked on the page background, which is
 * what read as broken rather than deliberate — and differ by fill and weight:
 * - `hero`  — gradient fill, white text, for the handful of statements that matter
 * - `card`  — solid border + tinted fill, for primary evidence
 * - `plain` — thin border, no fill, for supporting detail
 */
export type BlockEmphasis = "hero" | "card" | "plain";

type BlockBase = {
  id: string;
  /** Heading. Not user-editable by design. */
  title: string;
  /** One-line editable explanation of what this block is and why it's here. */
  description?: string;
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

/**
 * A named cluster of blocks inside a section. Groups are what the in-tab table
 * of contents lists: a tab with 10 blocks is unscannable, the same tab with 3
 * groups is. Titles are fixed vocabulary, same reasoning as block titles.
 */
export type Group = {
  id: string;
  title: string;
  /** One-line editable explanation of what this group of blocks covers. Always set — never left to a placeholder. */
  description: string;
  blocks: Block[];
};

export type Section = {
  id: string;
  /** Heading. Not user-editable by design. */
  title: string;
  groups: Group[];
};

/** Flattens a section's blocks — for counting, filtering and lookups. */
export function sectionBlocks(section: Section): Block[] {
  return section.groups.flatMap((g) => g.blocks);
}

/**
 * Guards against rendering a persisted document written by an older version of
 * this schema. Checks the version *and* the structure, since a doc saved before
 * `schemaVersion` existed has no version field at all.
 */
export function isBoardCompatible(value: unknown): value is Board {
  if (!value || typeof value !== "object") return false;
  const board = value as Partial<Board>;
  if (board.schemaVersion !== BOARD_SCHEMA_VERSION) return false;
  if (!Array.isArray(board.sections) || !Array.isArray(board.headline)) return false;
  return board.sections.every(
    (section) =>
      section &&
      Array.isArray(section.groups) &&
      section.groups.every((group) => group && Array.isArray(group.blocks))
  );
}

/**
 * Bump whenever the persisted document changes in a way a stored copy can't
 * satisfy. Stored boards on any other version are discarded and reseeded.
 *
 *   v1 → v2  `Section.blocks` became `Section.groups` (rendering v1 crashed)
 *   v2 → v3  added "The Market" section; a v2 board would never show the tab
 *   v3 → v4  filled in default `description` on every block; a v3 board had
 *            them blank and showed the generic empty-state placeholder
 *   v4 → v5  renamed group "Who we serve" to "Customer Information"
 *   v5 → v6  removed `Section.summary` — the per-tab description line was
 *            dropped from the page
 *   v6 → v7  "Firmographics" and "Target Personas" in Customer Information
 *            changed from `third`/`two-thirds` (same row) to `full` each
 *            (separate rows)
 *   v7 → v8  added the "Experience & design" group (Define). From here on a
 *            bump migrates stored boards (see `migrate.ts`) instead of
 *            discarding them, because boards now hold people's real answers.
 */
export const BOARD_SCHEMA_VERSION = 8;

export type Board = {
  id: string;
  schemaVersion: number;
  productName: string;
  /** One line on what the project is making, shown in the projects list. Optional, no schema bump. */
  description?: string;
  status: string;
  /** The 4-6 numbers worth seeing before you scroll. */
  headline: { id: string; label: string; value: string }[];
  sections: Section[];
  updatedAt: string;
  /**
   * How the project is run. Optional so boards saved before it existed stay
   * valid; missing means "product". No schema bump needed.
   */
  projectType?: ProjectType;
  /** Client sign-offs by stage id, for client engagements. */
  signoffs?: Partial<Record<string, StageSignoff>>;
};

/**
 * A product is continuous: stages show health and never close. A client
 * engagement is phased: a stage is finished when the client signs it off.
 */
export type ProjectType = "product" | "engagement";

export type StageSignoff = {
  /** Who signed off on the client side. */
  by: string;
  /** YYYY-MM-DD. */
  on: string;
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
