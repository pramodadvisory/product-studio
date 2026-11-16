/**
 * Builds the compact project picture the assistant reads on every turn.
 *
 * Built in the browser from the same data the pages show, so the model always
 * sees the current state, including anything applied earlier in the chat.
 * Ids are included because the propose_* tools must name real targets.
 */
import type { Decision } from "@/app/(main)/decisions/decisions";
import type { TaskBoard } from "@/app/(main)/design/experiments/tasks";
import { BACKLOG_SPRINT_ID, type Sprint, type StoryMap } from "@/app/(main)/develop/story-map/storymap";
import { STAGES, pagePath } from "@/lib/navigation";
import type { Block, Board } from "@/lib/product-board/schema";
import { blockGist, blocksFor } from "@/lib/product-board/view";
import type { ProjectSnapshot, SnapshotBlock } from "./schema";

function toSnapshotBlock(block: Block): SnapshotBlock {
  const base = { id: block.id, title: block.title, type: block.type, confidence: block.confidence ?? null };
  switch (block.type) {
    case "statement":
      return { ...base, content: { body: block.body } };
    case "list":
      return {
        ...base,
        content: {
          checkable: Boolean(block.checkable),
          items: block.items.map((i) => ({ id: i.id, text: i.text, done: Boolean(i.done) })),
        },
      };
    case "records": {
      const titleKey = block.fields.find((f) => f.kind === "title")?.key;
      return {
        ...base,
        content: {
          fields: block.fields.map((f) => ({ key: f.key, label: f.label })),
          items: block.items.map((i) => (titleKey ? i.values[titleKey] ?? "" : JSON.stringify(i.values))),
        },
      };
    }
    case "metrics":
      return { ...base, content: { items: block.items.map((i) => ({ label: i.label, value: i.value })) } };
    default:
      return { ...base, content: { summary: blockGist(block) } };
  }
}

export function buildSnapshot({
  board,
  decisions,
  experiments,
  storyMap,
  sprints,
  focusStage,
}: {
  board: Board;
  decisions: Decision[];
  experiments: TaskBoard;
  storyMap: StoryMap;
  sprints: Sprint[];
  focusStage: string;
}): ProjectSnapshot {
  const goals = new Map(storyMap.goals.map((g) => [g.id, g.title]));
  return {
    project: {
      name: board.productName,
      type: board.projectType ?? "product",
      focusStage,
    },
    pages: STAGES.flatMap((stage) =>
      stage.pages
        .filter((page) => page.groupIds?.length)
        .map((page) => ({
          path: pagePath(stage, page),
          blocks: blocksFor(board, page.groupIds ?? []).map(toSnapshotBlock),
        }))
    ),
    decisions: decisions.slice(0, 25).map((d) => ({ title: d.title, status: d.status, owner: d.owner })),
    hypotheses: experiments.map((h) => ({ id: h.id, title: h.title, status: h.status })),
    storyMap: {
      features: storyMap.features.map((f) => ({ id: f.id, title: f.title, goal: goals.get(f.goalId) ?? "" })),
      sprints: [
        ...sprints.map((s) => ({ id: s.id, name: `Sprint ${s.sprintNumber}: ${s.name}` })),
        { id: BACKLOG_SPRINT_ID, name: "Backlog" },
      ],
    },
  };
}
