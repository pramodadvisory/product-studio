/**
 * What "done" looks like for each stage, measured from the project's own data.
 *
 * Discover and Define ask questions (`src/lib/questions.ts`): they are done
 * when every question has an answer. Answers that are still assumptions stay
 * flagged on the page but don't hold the stage back; testing them is what
 * Design is for.
 *
 * Design, Develop and Deploy are measured by evidence. Every criterion is
 * computed, never ticked by hand: an experiment has concluded, sprint stories
 * are done, the launch checklist is complete.
 *
 * Stages are places, not gates. Nothing here locks a stage; it only says
 * where the gaps are and which stage deserves attention first.
 */
import {
  BACKLOG_SPRINT_ID,
  cellKey,
  type Sprint,
  type StoryMap,
} from "@/app/(main)/develop/story-map/storymap";
import type { TaskBoard } from "@/app/(main)/design/experiments/tasks";
import { STAGES, answerUrl, getStage, type StageId } from "@/lib/navigation";
import type { Board, ProjectType } from "@/lib/product-board/schema";
import { BLOCK_IDS, findBlock, headlineConfidence } from "@/lib/product-board/view";
import { answerProgress, questionStatuses } from "@/lib/questions";

export type Criterion = {
  label: string;
  met: boolean;
  /** Where to go to work on it. */
  href: string;
};

export type StageProgress = {
  /** `questions`: done when every question is answered. `evidence`: done when every check is met. */
  kind: "questions" | "evidence";
  criteria: Criterion[];
  met: number;
  total: number;
  complete: boolean;
  /** Answered questions that are still assumptions. Always 0 for evidence stages. */
  assumptions: number;
};

/** One criterion per question: met once it has an answer. */
function questionCriteria(board: Board, stageId: StageId): Criterion[] {
  const stage = getStage(stageId);
  return questionStatuses(board, stageId).map(({ question, answered }) => ({
    label: question.prompt,
    met: answered,
    href: answerUrl(stage, question.id),
  }));
}

type Inputs = {
  board: Board;
  experiments: TaskBoard;
  storyMap: StoryMap;
  sprints: Sprint[];
};

export function stageProgress({ board, experiments, storyMap, sprints }: Inputs): Record<StageId, StageProgress> {
  const block = (id: string) => findBlock(board, id);
  const allExperiments = experiments.flatMap((h) => h.experiments);
  const headline = board.headline.map((h) => headlineConfidence(board, h.id));
  const checklist = block(BLOCK_IDS.launchChecklist);

  const sprintStories = Object.entries(storyMap.storiesByCell)
    .filter(([key]) => !key.startsWith(cellKey(BACKLOG_SPRINT_ID, "")))
    .flatMap(([, stories]) => stories);

  const criteria: Record<StageId, Criterion[]> = {
    discover: questionCriteria(board, "discover"),
    define: questionCriteria(board, "define"),
    design: [
      { label: "Hypotheses written", met: experiments.length > 0, href: "/design/experiments" },
      { label: "An experiment has concluded", met: allExperiments.some((e) => e.status === "concluded"), href: "/design/experiments" },
      { label: "A hypothesis is validated", met: experiments.some((h) => h.status === "validated"), href: "/design/experiments" },
      {
        label: "Key numbers no longer assumptions",
        met: headline.length > 0 && headline.every((c) => c !== "assumption"),
        href: "/define",
      },
    ],
    develop: [
      {
        label: "Story map has goals and features",
        met: storyMap.goals.length > 0 && storyMap.features.length > 0,
        href: "/develop/story-map",
      },
      { label: "Sprints planned", met: sprints.length > 0, href: "/develop/story-map" },
      { label: "Delivery phases decided", met: block(BLOCK_IDS.phases)?.confidence === "decided", href: "/develop/delivery-plan" },
      {
        label: "Sprint stories done",
        met: sprintStories.length > 0 && sprintStories.every((s) => s.status === "done"),
        href: "/develop/story-map",
      },
    ],
    deploy: [
      {
        label: "Launch checklist complete",
        met: checklist?.type === "list" && checklist.items.length > 0 && checklist.items.every((i) => i.done),
        href: "/deploy/launch",
      },
      // No data source can be connected yet, so this stays unmet until one can.
      { label: "Targets tracked with live data", met: false, href: "/deploy/metrics" },
    ],
  };

  return Object.fromEntries(
    STAGES.map((stage) => {
      const list = criteria[stage.id];
      const met = list.filter((c) => c.met).length;
      const progress: StageProgress = stage.report
        ? { kind: "questions", criteria: list, met, total: list.length, complete: met === list.length, assumptions: answerProgress(board, stage.id).assumptions }
        : { kind: "evidence", criteria: list, met, total: list.length, complete: met === list.length, assumptions: 0 };
      return [stage.id, progress];
    })
  ) as Record<StageId, StageProgress>;
}

/**
 * The stage that deserves attention first. For a product: the earliest stage
 * whose criteria aren't all met. For a client engagement: the earliest stage
 * the client hasn't signed off.
 */
export function focusStage(
  progress: Record<StageId, StageProgress>,
  projectType: ProjectType,
  signoffs: Board["signoffs"]
): StageId {
  const open = STAGES.find((stage) =>
    projectType === "engagement" ? !signoffs?.[stage.id] : !progress[stage.id].complete
  );
  return (open ?? STAGES[STAGES.length - 1]).id;
}
