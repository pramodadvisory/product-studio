import { SEED_BOARD } from "./seed";
import type { Block, Board, Group, ProjectType } from "./schema";

/**
 * Blank boards for new projects.
 *
 * A new project has the same structure as the sample (sections, groups, block
 * titles, descriptions, metric labels and record fields) with every answer
 * empty, so each question in Discover and Define starts open. Every block
 * starts as an assumption: nothing has been tested yet.
 */
export function blankBlock(source: Block): Block {
  const block = structuredClone(source);
  block.confidence = "assumption";
  delete block.updatedAt;
  delete block.updatedBy;
  switch (block.type) {
    case "statement":
      block.body = "";
      break;
    case "metrics":
      // Labels are kept as suggestions (TAM, SAM, SOM…); the values are the answer.
      block.items = block.items.map((item) => ({ ...item, value: "" }));
      break;
    case "list":
    case "records":
    case "timeline":
      block.items = [];
      break;
    case "chart":
      block.rows = [];
      block.caption = "";
      // Competitor names in the sample's radar are the sample's own answer.
      if (block.variant === "radar") block.series = block.series.slice(0, 1);
      break;
  }
  return block;
}

export function blankGroup(source: Group): Group {
  return { ...structuredClone(source), blocks: source.blocks.map(blankBlock) };
}

export function createBlankBoard({
  id,
  name,
  description,
  projectType,
}: {
  id: string;
  name: string;
  description?: string;
  projectType: ProjectType;
}): Board {
  const now = new Date().toISOString();
  return {
    id,
    schemaVersion: SEED_BOARD.schemaVersion,
    productName: name,
    description: description || undefined,
    status: "Draft",
    projectType,
    headline: SEED_BOARD.headline.map((item) => ({ ...item, value: "" })),
    sections: SEED_BOARD.sections.map((section) => ({
      ...section,
      groups: section.groups.map(blankGroup),
    })),
    updatedAt: now,
  };
}
