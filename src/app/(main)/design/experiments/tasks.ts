// ─── Hypothesis-driven delivery domain ────────────────────────────────────────
// The Tasks board is a three-level tree:
//
//   Hypothesis  — a belief about users or the business, waiting to be proven
//     Experiment — the test that settles it, with a metric and a target
//       Story    — the delivery work the experiment needs to run
//
// Stories reuse `StoryItem` from the story map so the same shape (status,
// points, key, assignee) travels across both boards; nothing here widens it.
//
// State lives in memory only for now (see page.tsx) — every mutation below is a
// pure `board -> board` transition, so swapping in persistence later is a matter
// of saving the value these return, not rewriting the callers.

import type { StoryItem } from "@/app/(main)/storymap/storymap";

export type { StoryItem };

// ─── Status vocabularies ──────────────────────────────────────────────────────
export const HYPOTHESIS_STATUSES = [
  "unvalidated",
  "testing",
  "validated",
  "invalidated",
] as const;
export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number];

export const EXPERIMENT_STATUSES = [
  "planned",
  "running",
  "concluded",
  "abandoned",
] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const STORY_STATUSES = [
  "todo",
  "in-progress",
  "done",
  "blocked",
] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const HYPOTHESIS_STATUS_LABEL: Record<HypothesisStatus, string> = {
  unvalidated: "Unvalidated",
  testing: "Testing",
  validated: "Validated",
  invalidated: "Invalidated",
};

export const EXPERIMENT_STATUS_LABEL: Record<ExperimentStatus, string> = {
  planned: "Planned",
  running: "Running",
  concluded: "Concluded",
  abandoned: "Abandoned",
};

export const STORY_STATUS_LABEL: Record<StoryStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
  blocked: "Blocked",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type Experiment = {
  id: string;
  title: string;
  /** What the experiment moves — one metric, not a dashboard. */
  metric: string;
  /** The threshold that counts as a win, e.g. "+15% signup conversion". */
  target: string;
  startDate: string; // ISO yyyy-mm-dd, "" while unscheduled
  endDate: string; // ISO yyyy-mm-dd, "" while unscheduled
  status: ExperimentStatus;
  /** What was learned. Only meaningful once the experiment has concluded. */
  result: string;
  stories: StoryItem[];
};

export type Hypothesis = {
  id: string;
  title: string;
  /** "We believe that…" — the claim being put at risk. */
  belief: string;
  /** "We'll know we're right when…" — the evidence that would settle it. */
  signal: string;
  status: HypothesisStatus;
  /** 0–100. How sure the team is *before* the evidence lands. */
  confidence: number;
  experiments: Experiment[];
};

export type TaskBoard = Hypothesis[];

// ─── Rollups ──────────────────────────────────────────────────────────────────
export type Progress = {
  storyCount: number;
  doneCount: number;
  points: number;
  donePoints: number;
  /** 0–100, by story count. 0 when there are no stories yet. */
  percent: number;
};

function tally(stories: StoryItem[]): Progress {
  let doneCount = 0;
  let points = 0;
  let donePoints = 0;

  for (const story of stories) {
    const storyPoints = story.storyPoints ?? 0;
    points += storyPoints;
    if (story.status === "done") {
      doneCount += 1;
      donePoints += storyPoints;
    }
  }

  return {
    storyCount: stories.length,
    doneCount,
    points,
    donePoints,
    percent: stories.length
      ? Math.round((doneCount / stories.length) * 100)
      : 0,
  };
}

export function experimentProgress(experiment: Experiment): Progress {
  return tally(experiment.stories);
}

export function hypothesisProgress(hypothesis: Hypothesis): Progress {
  return tally(hypothesis.experiments.flatMap((e) => e.stories));
}

export function boardCounts(board: TaskBoard) {
  const experiments = board.flatMap((h) => h.experiments);
  return {
    hypotheses: board.length,
    experiments: experiments.length,
    running: experiments.filter((e) => e.status === "running").length,
    stories: experiments.reduce((total, e) => total + e.stories.length, 0),
  };
}

export function countByStatus(board: TaskBoard) {
  const counts = Object.fromEntries(
    HYPOTHESIS_STATUSES.map((status) => [status, 0])
  ) as Record<HypothesisStatus, number>;
  for (const hypothesis of board) counts[hypothesis.status] += 1;
  return counts;
}

// ─── Ids & keys ───────────────────────────────────────────────────────────────
// Callers only ever create ids in event handlers, so `crypto.randomUUID` is safe
// here — nothing in this module runs during SSR.
function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const STORY_KEY_PREFIX = "EXP";

/**
 * Next free story key across the whole board, so keys stay unique even after a
 * story moves or an experiment is deleted.
 */
export function nextStoryKey(board: TaskBoard) {
  const highest = board
    .flatMap((h) => h.experiments)
    .flatMap((e) => e.stories)
    .reduce((max, story) => {
      const match = story.storyKey?.match(
        new RegExp(`^${STORY_KEY_PREFIX}-(\\d+)$`)
      );
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
  return `${STORY_KEY_PREFIX}-${highest + 1}`;
}

// ─── Nested update helpers ────────────────────────────────────────────────────
// Every transition below funnels through these two, so a patch at any depth
// rebuilds exactly the branch it touched and leaves siblings referentially
// identical — which is what keeps the accordion from re-rendering wholesale.
function patchHypothesis(
  board: TaskBoard,
  hypothesisId: string,
  update: (hypothesis: Hypothesis) => Hypothesis
): TaskBoard {
  return board.map((hypothesis) =>
    hypothesis.id === hypothesisId ? update(hypothesis) : hypothesis
  );
}

function patchExperiment(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string,
  update: (experiment: Experiment) => Experiment
): TaskBoard {
  return patchHypothesis(board, hypothesisId, (hypothesis) => ({
    ...hypothesis,
    experiments: hypothesis.experiments.map((experiment) =>
      experiment.id === experimentId ? update(experiment) : experiment
    ),
  }));
}

// ─── Hypothesis transitions ───────────────────────────────────────────────────
export function createHypothesis(input?: Partial<Hypothesis>): Hypothesis {
  return {
    id: newId("hyp"),
    title: "",
    belief: "",
    signal: "",
    status: "unvalidated",
    confidence: 50,
    experiments: [],
    ...input,
  };
}

export function addHypothesis(
  board: TaskBoard,
  hypothesis: Hypothesis
): TaskBoard {
  return [hypothesis, ...board];
}

export function updateHypothesis(
  board: TaskBoard,
  hypothesisId: string,
  patch: Partial<Omit<Hypothesis, "id" | "experiments">>
): TaskBoard {
  return patchHypothesis(board, hypothesisId, (hypothesis) => ({
    ...hypothesis,
    ...patch,
  }));
}

/** Deleting a hypothesis takes its experiments and their stories with it. */
export function deleteHypothesis(
  board: TaskBoard,
  hypothesisId: string
): TaskBoard {
  return board.filter((hypothesis) => hypothesis.id !== hypothesisId);
}

export function hypothesisDeleteImpact(hypothesis: Hypothesis) {
  return {
    experimentCount: hypothesis.experiments.length,
    storyCount: hypothesis.experiments.reduce(
      (total, experiment) => total + experiment.stories.length,
      0
    ),
  };
}

// ─── Experiment transitions ───────────────────────────────────────────────────
export function createExperiment(input?: Partial<Experiment>): Experiment {
  return {
    id: newId("exp"),
    title: "",
    metric: "",
    target: "",
    startDate: "",
    endDate: "",
    status: "planned",
    result: "",
    stories: [],
    ...input,
  };
}

export function addExperiment(
  board: TaskBoard,
  hypothesisId: string,
  experiment: Experiment
): TaskBoard {
  return patchHypothesis(board, hypothesisId, (hypothesis) => ({
    ...hypothesis,
    experiments: [...hypothesis.experiments, experiment],
  }));
}

export function updateExperiment(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string,
  patch: Partial<Omit<Experiment, "id" | "stories">>
): TaskBoard {
  return patchExperiment(board, hypothesisId, experimentId, (experiment) => ({
    ...experiment,
    ...patch,
  }));
}

export function deleteExperiment(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string
): TaskBoard {
  return patchHypothesis(board, hypothesisId, (hypothesis) => ({
    ...hypothesis,
    experiments: hypothesis.experiments.filter(
      (experiment) => experiment.id !== experimentId
    ),
  }));
}

// ─── Story transitions ────────────────────────────────────────────────────────
export function createStory(
  board: TaskBoard,
  input?: Partial<StoryItem>
): StoryItem {
  return {
    id: newId("story"),
    text: "",
    status: "todo",
    priority: "medium",
    storyPoints: 1,
    storyKey: nextStoryKey(board),
    ...input,
  };
}

export function addStory(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string,
  story: StoryItem
): TaskBoard {
  return patchExperiment(board, hypothesisId, experimentId, (experiment) => ({
    ...experiment,
    stories: [...experiment.stories, story],
  }));
}

export function updateStory(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string,
  storyId: string,
  patch: Partial<Omit<StoryItem, "id">>
): TaskBoard {
  return patchExperiment(board, hypothesisId, experimentId, (experiment) => ({
    ...experiment,
    stories: experiment.stories.map((story) =>
      story.id === storyId ? { ...story, ...patch } : story
    ),
  }));
}

export function deleteStory(
  board: TaskBoard,
  hypothesisId: string,
  experimentId: string,
  storyId: string
): TaskBoard {
  return patchExperiment(board, hypothesisId, experimentId, (experiment) => ({
    ...experiment,
    stories: experiment.stories.filter((story) => story.id !== storyId),
  }));
}

// ─── Dates ────────────────────────────────────────────────────────────────────
const DATE_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

/** "Aug 5 – 18", "Aug 5 – Sep 2", "Aug 5 →" or "" when nothing is set. */
export function formatWindow(startDate: string, endDate: string) {
  if (!startDate && !endDate) return "";

  const format = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  };

  if (!endDate) {
    return `${format(startDate).toLocaleDateString("en-US", DATE_LABEL_FORMAT)} →`;
  }
  if (!startDate) {
    return `→ ${format(endDate).toLocaleDateString("en-US", DATE_LABEL_FORMAT)}`;
  }

  const start = format(startDate);
  const end = format(endDate);
  const startLabel = start.toLocaleDateString("en-US", DATE_LABEL_FORMAT);
  const endLabel =
    start.getMonth() === end.getMonth()
      ? String(end.getDate())
      : end.toLocaleDateString("en-US", DATE_LABEL_FORMAT);
  return `${startLabel} – ${endLabel}`;
}
