/**
 * Applying a proposal, and undoing it.
 *
 * Every change goes through the same functions the pages use (mutateBlock,
 * saveDecision, the experiments and story-map setters), so the assistant can
 * do nothing a person on the page couldn't. Each apply returns its own undo.
 */
import type { DecisionDraft } from "@/app/(main)/decisions/decisions";
import {
  addHypothesis,
  createHypothesis,
  deleteHypothesis,
  type TaskBoard,
} from "@/app/(main)/design/experiments/tasks";
import { cellKey, type StoryItem, type StoryMap } from "@/app/(main)/develop/story-map/storymap";
import { pagePath, pageUrl } from "@/lib/navigation";
import { CONFIDENCE_LABEL, newId, type Block, type Board, type Confidence } from "@/lib/product-board/schema";
import { findBlock, locateBlock, weakerConfidence } from "@/lib/product-board/view";
import type { Proposal } from "./schema";

export type ApplyContext = {
  board: Board | null;
  mutateBlock: (blockId: string, recipe: (block: Block) => void) => void;
  saveDecision: (draft: DecisionDraft) => { id: string };
  deleteDecision: (id: string) => void;
  setExperiments: React.Dispatch<React.SetStateAction<TaskBoard>>;
  setMap: React.Dispatch<React.SetStateAction<StoryMap>>;
};

export type AppliedChange = {
  undo: () => void;
  /** Where the change can be seen. */
  href: string;
};

/** What a proposal card shows: where it goes, what kind of change, and its side effects. */
export type ProposalDescription = {
  where: string;
  kind: string;
  /** A consequence worth knowing before applying, e.g. a confidence downgrade. */
  effect?: string;
  confidence?: Confidence;
};

const AUTHOR = "Studio assistant";

const OPERATION_LABEL: Record<string, string> = {
  replace_statement: "Rewrite",
  add_list_item: "Add item",
  complete_list_item: "Tick off",
  add_record: "Add entry",
  set_metric: "Set number",
  set_confidence: "Change confidence",
};

export function describeProposal(proposal: Proposal, board: Board | null): ProposalDescription {
  switch (proposal.tool) {
    case "propose_board_update": {
      const { input } = proposal;
      const block = board ? findBlock(board, input.block_id) : undefined;
      const place = board ? locateBlock(board, input.block_id) : undefined;
      const blockTitle = block?.title ?? input.block_id;
      const where = place ? `${pagePath(place.stage, place.page)} › ${blockTitle}` : blockTitle;
      const next = resultingConfidence(input.operation, block?.confidence, input.confidence);
      const effect =
        block?.confidence && next !== block.confidence
          ? `Marks “${blockTitle}” as ${CONFIDENCE_LABEL[next].toLowerCase()} (now ${CONFIDENCE_LABEL[block.confidence].toLowerCase()}).`
          : undefined;
      return { where, kind: OPERATION_LABEL[input.operation], effect, confidence: input.confidence };
    }
    case "propose_decision":
      return {
        where: "Library › Decisions",
        kind: proposal.input.status === "decided" ? "Record a decision" : "Record a proposed decision",
      };
    case "propose_hypothesis": {
      const linked = proposal.input.tests_block_id && board ? findBlock(board, proposal.input.tests_block_id) : undefined;
      return {
        where: "Design › Experiments",
        kind: "New hypothesis",
        effect: linked ? `Tests the assumption in “${linked.title}”.` : undefined,
      };
    }
    case "propose_story":
      return { where: "Develop › Story map", kind: "New story" };
  }
}

/**
 * The block's confidence after a change. Adding unproven content to a proven
 * block makes the block only as strong as its weakest part; rewriting or
 * explicitly setting it takes the proposal's level.
 */
function resultingConfidence(operation: string, current: Confidence | undefined, proposed: Confidence): Confidence {
  if (operation === "replace_statement" || operation === "set_confidence") return proposed;
  if (operation === "complete_list_item") return current ?? proposed;
  return weakerConfidence(current, proposed);
}

export function applyProposal(proposal: Proposal, ctx: ApplyContext): AppliedChange {
  switch (proposal.tool) {
    case "propose_board_update": {
      const { input } = proposal;
      const board = ctx.board;
      const before = board ? findBlock(board, input.block_id) : undefined;
      if (!board || !before) throw new Error("That block is no longer on the board.");
      const snapshot = structuredClone(before);

      ctx.mutateBlock(input.block_id, (block) => {
        switch (input.operation) {
          case "replace_statement":
            if (block.type === "statement" && input.text) block.body = input.text;
            break;
          case "add_list_item":
            if (block.type === "list" && input.text) block.items.push({ id: newId("i"), text: input.text });
            break;
          case "complete_list_item":
            if (block.type === "list") {
              const item = block.items.find((i) => i.id === input.item_id);
              if (item) item.done = true;
            }
            break;
          case "add_record":
            if (block.type === "records" && input.record) {
              block.items.push({
                id: newId("r"),
                values: Object.fromEntries(input.record.map((f) => [f.field, f.value])),
              });
            }
            break;
          case "set_metric":
            if (block.type === "metrics" && input.metric) {
              const label = input.metric.label.trim();
              const existing = block.items.find((i) => i.label.toLowerCase() === label.toLowerCase());
              if (existing) existing.value = input.metric.value;
              else block.items.push({ id: newId("m"), label, value: input.metric.value });
            }
            break;
          case "set_confidence":
            break;
        }
        block.confidence = resultingConfidence(input.operation, snapshot.confidence, input.confidence);
        block.updatedBy = AUTHOR;
      });

      const place = locateBlock(board, input.block_id);
      return {
        href: place ? pageUrl(place.stage, place.page) : "/overview",
        undo: () =>
          ctx.mutateBlock(input.block_id, (block) => {
            // Restore the block exactly as it was before Apply.
            const target = block as unknown as Record<string, unknown>;
            for (const key of Object.keys(target)) delete target[key];
            Object.assign(target, structuredClone(snapshot));
          }),
      };
    }

    case "propose_decision": {
      const { input } = proposal;
      const saved = ctx.saveDecision({
        title: input.title,
        decision: input.decision,
        context: input.context,
        rationale: input.rationale,
        alternatives: [],
        consequences: [],
        owner: input.owner ?? "",
        stakeholders: [],
        status: input.status,
        impact: input.impact,
        decidedOn: new Date().toISOString().slice(0, 10),
        tags: [],
        confidence: "medium",
        source: "chat",
      });
      return { href: "/decisions", undo: () => ctx.deleteDecision(saved.id) };
    }

    case "propose_hypothesis": {
      const { input } = proposal;
      const hypothesis = createHypothesis({
        title: input.title,
        belief: input.belief,
        signal: input.signal,
        testsBlockId: input.tests_block_id ?? undefined,
      });
      ctx.setExperiments((prev) => addHypothesis(prev, hypothesis));
      return {
        href: `/design/experiments?open=${encodeURIComponent(hypothesis.id)}`,
        undo: () => ctx.setExperiments((prev) => deleteHypothesis(prev, hypothesis.id)),
      };
    }

    case "propose_story": {
      const { input } = proposal;
      const story: StoryItem = {
        id: `story-${crypto.randomUUID().slice(0, 8)}`,
        text: input.text,
        status: "todo",
        priority: input.priority,
      };
      const key = cellKey(input.sprint_id, input.feature_id);
      ctx.setMap((prev) => ({
        ...prev,
        storiesByCell: { ...prev.storiesByCell, [key]: [...(prev.storiesByCell[key] ?? []), story] },
      }));
      return {
        href: "/develop/story-map",
        undo: () =>
          ctx.setMap((prev) => ({
            ...prev,
            storiesByCell: {
              ...prev.storiesByCell,
              [key]: (prev.storiesByCell[key] ?? []).filter((s) => s.id !== story.id),
            },
          })),
      };
    }
  }
}
