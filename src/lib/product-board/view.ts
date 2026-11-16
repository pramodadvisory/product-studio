/**
 * How the stored board is presented.
 *
 * The stored document keeps its original sections (problem, solution, market,
 * outcome, progress) so saved boards stay valid with no migration. Which
 * groups appear on which page is decided by the stage pages in
 * `src/lib/navigation.ts` (`groupIds`); this file holds the lookups and the
 * small summaries those pages and the assistant need.
 */
import { STAGES, locateGroup, type Stage, type StagePage } from "@/lib/navigation";
import type { Block, Board, Confidence, Group } from "./schema";

/** Block ids other parts of the app read directly. */
export const BLOCK_IDS = {
  icp: "b-icp",
  pains: "b-pains",
  marketSize: "b-market-size",
  competitors: "b-competitors",
  valueProp: "b-valueprop",
  features: "b-features",
  unitEconomics: "b-unit-economics",
  kpis: "b-kpis",
  risks: "b-risks",
  phases: "b-phases",
  launchChecklist: "b-checklist",
} as const;

/**
 * The board's headline numbers carry no confidence of their own; each one is
 * only as solid as the block it comes from.
 */
const HEADLINE_SOURCE: Record<string, string> = {
  "h-tam": "b-market-size",
  "h-arr": "b-arr",
  "h-customers": "b-customers",
  "h-payback": "b-unit-economics",
  "h-ga": "b-phases",
};

export function findGroup(board: Board, groupId: string): Group | undefined {
  for (const section of board.sections) {
    const group = section.groups.find((g) => g.id === groupId);
    if (group) return group;
  }
  return undefined;
}

export function findBlock(board: Board, blockId: string): Block | undefined {
  for (const section of board.sections) {
    for (const group of section.groups) {
      const block = group.blocks.find((b) => b.id === blockId);
      if (block) return block;
    }
  }
  return undefined;
}

/** The group a block lives in. */
export function groupOfBlock(board: Board, blockId: string): Group | undefined {
  for (const section of board.sections) {
    for (const group of section.groups) {
      if (group.blocks.some((b) => b.id === blockId)) return group;
    }
  }
  return undefined;
}

/** The stage page that shows a block, e.g. Discover › Customers & pain points. */
export function locateBlock(
  board: Board,
  blockId: string
): { stage: Stage; page: StagePage } | undefined {
  const group = groupOfBlock(board, blockId);
  return group ? locateGroup(group.id) : undefined;
}

export function groupsFor(board: Board, groupIds: string[]): Group[] {
  return groupIds.map((id) => findGroup(board, id)).filter((g): g is Group => Boolean(g));
}

export function blocksFor(board: Board, groupIds: string[]): Block[] {
  return groupsFor(board, groupIds).flatMap((group) => group.blocks);
}

/** Every board block that appears on some stage page, with where it appears. */
export function placedBlocks(
  board: Board
): { block: Block; stage: Stage; page: StagePage }[] {
  return STAGES.flatMap((stage) =>
    stage.pages.flatMap((page) =>
      blocksFor(board, page.groupIds ?? []).map((block) => ({ block, stage, page }))
    )
  );
}

export function countConfidence(blocks: Block[]): Record<Confidence, number> {
  const counts: Record<Confidence, number> = { assumption: 0, validated: 0, decided: 0 };
  for (const block of blocks) if (block.confidence) counts[block.confidence] += 1;
  return counts;
}

export function headlineConfidence(board: Board, headlineId: string): Confidence | undefined {
  const source = HEADLINE_SOURCE[headlineId];
  return source ? findBlock(board, source)?.confidence : undefined;
}

/** Proven means tested (validated) or formally agreed (decided). */
export function isProven(block: Block | undefined): boolean {
  return block?.confidence === "validated" || block?.confidence === "decided";
}

const CONFIDENCE_RANK: Record<Confidence, number> = { assumption: 0, validated: 1, decided: 2 };

/** The weaker of two confidence levels. */
export function weakerConfidence(a: Confidence | undefined, b: Confidence): Confidence {
  if (!a) return b;
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

/** One line that stands for a block, for rows and summaries. */
export function blockGist(block: Block): string {
  switch (block.type) {
    case "statement":
      return block.body;
    case "metrics":
      return block.items
        .slice(0, 3)
        .map((item) => `${item.label} ${item.value}`)
        .join(" · ");
    case "list":
      return withMore(block.items.map((item) => item.text), 2);
    case "records": {
      const titleKey = block.fields.find((f) => f.kind === "title")?.key;
      if (!titleKey) return `${block.items.length} items`;
      return withMore(block.items.map((item) => item.values[titleKey] ?? ""), 2);
    }
    case "timeline":
      return block.items.map((item) => item.label).join(" · ");
    case "chart":
      return block.caption;
  }
}

function withMore(parts: string[], keep: number): string {
  const shown = parts.filter(Boolean).slice(0, keep);
  const rest = parts.length - shown.length;
  return rest > 0 ? `${shown.join(" · ")} · ${rest} more` : shown.join(" · ");
}

/** The line under a page's name: its first headline block, in one line. */
export function pageGist(board: Board, page: StagePage): string {
  const blocks = blocksFor(board, page.groupIds ?? []);
  const lead = blocks.find((b) => b.inSummary) ?? blocks[0];
  return lead ? blockGist(lead) : "";
}

export function pluralise(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
