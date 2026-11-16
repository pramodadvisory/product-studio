/**
 * The Overview's ranked queue of things waiting on the product manager.
 *
 * Pure functions over data the other pages already own, so the Overview never
 * keeps a second copy of anything.
 */
import type { Decision } from "@/app/(main)/decisions/decisions";
import type { TaskBoard } from "@/app/(main)/design/experiments/tasks";
import { answerUrl, getStage, getStagePage, pageUrl, type StageId } from "@/lib/navigation";
import type { Board } from "@/lib/product-board/schema";
import { BLOCK_IDS, findBlock, pluralise } from "@/lib/product-board/view";
import { answerProgress, nextOpenQuestion } from "@/lib/questions";

const DAY = 1000 * 60 * 60 * 24;

export type AttentionItem = {
  id: string;
  /** Short label for what kind of thing this is, e.g. "Decision waiting on you". */
  kind: string;
  title: string;
  /** One line of context under the title. */
  detail: string;
  /** Longer explanation, shown only on the top item. */
  body?: string;
  /** The verb on the page's single primary button when this item is on top. */
  actionLabel: string;
  href: string;
};

/**
 * Ranked by what unblocks the most other work:
 * 1. decisions waiting on a call, oldest first, because other work waits on them;
 * 2. the next open question in the focus stage, when it asks questions;
 * 3. running experiments, because their results feed the next decision;
 * 4. high-impact risks;
 * 5. open launch-readiness tasks.
 */
export function buildAttentionQueue({
  board,
  decisions,
  experiments,
  focus,
  now,
}: {
  board: Board | null;
  decisions: Decision[];
  experiments: TaskBoard;
  /** The stage that deserves attention first. */
  focus?: StageId;
  now: number;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  const waiting = decisions
    .filter((decision) => decision.status === "proposed")
    .sort((a, b) => a.createdAt - b.createdAt);
  for (const decision of waiting) {
    const days = Math.max(0, Math.floor((now - decision.createdAt) / DAY));
    const age = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    const who = decision.owner ? `Proposed by ${decision.owner} ${age}` : `Proposed ${age}`;
    items.push({
      id: `decision-${decision.id}`,
      kind: "Decision waiting on you",
      title: decision.title,
      detail: `${who} · ${decision.impact} impact`,
      body: decision.context || decision.decision,
      actionLabel: "Make the call",
      href: "/decisions",
    });
  }

  if (board && focus) {
    const stage = getStage(focus);
    const next = stage.report ? nextOpenQuestion(board, focus) : undefined;
    if (next) {
      const progress = answerProgress(board, focus);
      const open = progress.total - progress.answered;
      items.push({
        id: `question-${next.id}`,
        kind: `Next question · ${stage.name}`,
        title: next.prompt,
        detail: `${pluralise(open, "question")} still open in ${stage.name}`,
        body: next.why,
        actionLabel: progress.answered === 0 ? `Start ${stage.name}` : "Answer the next question",
        href: answerUrl(stage, next.id),
      });
    }
  }

  for (const hypothesis of experiments) {
    for (const experiment of hypothesis.experiments) {
      if (experiment.status !== "running") continue;
      items.push({
        id: `experiment-${experiment.id}`,
        kind: "Experiment running",
        title: `Log results: ${experiment.title}`,
        detail: experiment.target ? `Target: ${experiment.target}` : `Tests: ${hypothesis.title}`,
        body: hypothesis.belief || hypothesis.title,
        actionLabel: "Log results",
        href: `/design/experiments?open=${encodeURIComponent(hypothesis.id)}`,
      });
    }
  }

  if (board) {
    const risks = findBlock(board, BLOCK_IDS.risks);
    if (risks?.type === "records") {
      const high = risks.items.filter((item) => item.values.impact?.trim().toLowerCase() === "high");
      if (high.length > 0) {
        const names = high.map((item) => item.values.risk).filter(Boolean);
        items.push({
          id: "risks-high",
          kind: "Risks",
          title: `Review ${pluralise(high.length, "high-impact risk")}`,
          detail: names.slice(0, 3).join(", "),
          actionLabel: "Review risks",
          href: pageUrl(getStage("define"), getStagePage("define", "risks").page),
        });
      }
    }

    const checklist = findBlock(board, BLOCK_IDS.launchChecklist);
    if (checklist?.type === "list") {
      const open = checklist.items.filter((item) => !item.done);
      if (open.length > 0) {
        items.push({
          id: "launch-readiness",
          kind: "Launch readiness",
          title: "Finish launch readiness",
          detail: `${open.length} of ${checklist.items.length} still open · next: ${open[0].text}`,
          actionLabel: "Open the checklist",
          href: "/deploy/launch",
        });
      }
    }
  }

  return items;
}
