/**
 * What a published project shows, worked out from the frozen board alone.
 *
 * Shared by the published page (to render it) and by `changes.ts` (to say
 * what changed between two versions), so "what a reader can see" has one
 * definition. Plain functions only: this runs on the server.
 */
import { STAGES, type Stage, type StagePage } from "@/lib/navigation";
import type { Block, Board } from "@/lib/product-board/schema";
import { BLOCK_IDS, blocksFor, findBlock } from "@/lib/product-board/view";
import { answerProgress, isAnswered, questionStatuses } from "@/lib/questions";
import type { PillTone } from "@/components/status-pill";

export type PublishedSection = {
  stage: Stage;
  page: StagePage;
  /** The answers, in question order. */
  blocks: Block[];
  /** Supporting blocks no question asks for (charts and the like), folded away. */
  optional: Block[];
};

export type PublishedStage = {
  stage: Stage;
  sections: PublishedSection[];
};

/**
 * Every stage page that has something to read. Unanswered questions and
 * empty blocks are left out: a reader can't answer them, and an empty box
 * reads as broken. Pages that aren't built from the board (experiments, the
 * story map, metrics) aren't stored with it, so they can't be published yet.
 */
export function publishedContent(board: Board): PublishedStage[] {
  return STAGES.map((stage) => ({
    stage,
    sections: stage.pages.flatMap((page): PublishedSection[] => {
      if (!page.groupIds?.length) return [];
      const statuses = questionStatuses(board, stage.id, page.slug);
      const all = blocksFor(board, page.groupIds).filter(isAnswered);

      // A page with no questions (delivery plan, launch checklist) is all answer.
      if (statuses.length === 0) {
        return all.length ? [{ stage, page, blocks: all, optional: [] }] : [];
      }

      const asked = new Set(statuses.map((s) => s.question.blockId));
      const blocks = statuses.flatMap(({ block, answered }) => (answered && block ? [block] : []));
      const optional = all.filter((b) => !asked.has(b.id));
      return blocks.length || optional.length ? [{ stage, page, blocks, optional }] : [];
    }),
  })).filter((s) => s.sections.length > 0);
}

/** Every block a reader can see, with the section it's in. */
export function visibleBlocks(board: Board): Map<string, { block: Block; section: PublishedSection }> {
  const map = new Map<string, { block: Block; section: PublishedSection }>();
  for (const { sections } of publishedContent(board)) {
    for (const section of sections) {
      for (const block of [...section.blocks, ...section.optional]) map.set(block.id, { block, section });
    }
  }
  return map;
}

export type StageStanding = {
  tone: PillTone;
  label: string;
  /** Extra line, e.g. who signed it off. */
  detail?: string;
};

/**
 * One chip per stage for "Where it stands". Uses only what is stored with the
 * board: the in-app stage progress also counts experiments and sprint
 * stories, which aren't published, so it can't be reused as-is here.
 */
export function stageStanding(board: Board, stage: Stage): StageStanding {
  const signoff = board.projectType === "engagement" ? board.signoffs?.[stage.id] : undefined;
  if (signoff) return { tone: "ok", label: "Signed off", detail: `by ${signoff.by}, ${signoff.on}` };

  if (stage.report) {
    const progress = answerProgress(board, stage.id);
    if (progress.complete) return { tone: "ok", label: "Complete" };
    if (progress.answered === 0) return { tone: "neutral", label: "Not started" };
    return { tone: "info", label: `${progress.answered} of ${progress.total} answered` };
  }

  switch (stage.id) {
    case "develop": {
      const phases = findBlock(board, BLOCK_IDS.phases);
      if (!isAnswered(phases)) return { tone: "neutral", label: "Not started" };
      return phases?.confidence === "decided"
        ? { tone: "ok", label: "Plan decided" }
        : { tone: "info", label: "Plan drafted" };
    }
    case "deploy": {
      const checklist = findBlock(board, BLOCK_IDS.launchChecklist);
      const items = checklist?.type === "list" ? checklist.items.filter((i) => i.text.trim()) : [];
      if (items.length === 0) return { tone: "neutral", label: "Not started" };
      const done = items.filter((i) => i.done).length;
      return done === items.length
        ? { tone: "ok", label: "Ready to launch" }
        : { tone: "info", label: `${done} of ${items.length} launch items done` };
    }
    default:
      // Design's experiments live outside the board, so they aren't published.
      return { tone: "neutral", label: "Not shared" };
  }
}
