// ─── Story Map domain ─────────────────────────────────────────────────────────
// Pure state transitions for the story map. Every mutation the board performs
// goes through one of the functions below so that deletes stay atomic (a goal
// delete cascades into feature reparenting and story relocation in a single
// step) and so undo is a plain snapshot/restore of `StoryMap`.
//
// The board has two axes and each needs a fallback for orphaned work:
//   vertical (time)      Sprint  → BACKLOG_SPRINT_ID
//   horizontal (structure) Goal → Feature → UNASSIGNED_GOAL_ID / UNASSIGNED_FEATURE_ID
//
// Deleting on one axis never moves a story on the other: relocation only ever
// rewrites the feature half of a cell key, so a story committed to Sprint 2
// stays in Sprint 2.

// ─── Reserved ids ─────────────────────────────────────────────────────────────
export const BACKLOG_SPRINT_ID = "backlog";
export const UNASSIGNED_GOAL_ID = "__unassigned_goal__";
export const UNASSIGNED_FEATURE_ID = "__unassigned_feature__";

export const UNASSIGNED_GOAL_TITLE = "Unassigned";
export const UNASSIGNED_FEATURE_TITLE = "No feature";

export function isReservedGoalId(id: string) {
  return id === UNASSIGNED_GOAL_ID;
}

export function isReservedFeatureId(id: string) {
  return id === UNASSIGNED_FEATURE_ID;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type Goal = {
  id: string;
  title: string;
};

export type Feature = {
  id: string;
  title: string;
  goalId: string;
};

export type Sprint = {
  id: string;
  sprintNumber: number; // fixed at creation, never user-editable
  name: string;
  outcome: string; // what the client gets by the end of this sprint
  window: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
};

export type StoryItem = {
  id: string;
  text: string;
  status?: "todo" | "in-progress" | "done" | "blocked";
  priority?: "low" | "medium" | "high";
  storyPoints?: number;
  storyKey?: string;
  assignee?: string;
};

export type StoriesByCell = Record<string, StoryItem[]>;

export type StoryMap = {
  goals: Goal[];
  features: Feature[];
  storiesByCell: StoriesByCell;
};

// ─── Sprint dates ─────────────────────────────────────────────────────────────
// Sprints are stored newest-first (see page.tsx), so sprints[0] is the most
// recently added row — the one a new sprint's default start date chains off of.

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Sunday (0) and Saturday (6) are skipped so sprints default to starting on a
// business day.
function firstWeekdayOnOrAfter(date: Date) {
  const next = new Date(date);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Next sprint's suggested start: the first weekday after the latest sprint's
// end date, or today (skipped forward to a weekday) if there is no sprint yet.
export function suggestNextStartDate(sprints: Sprint[], today: Date): string {
  const latest = sprints[0];
  if (!latest?.endDate) return toISODate(firstWeekdayOnOrAfter(today));

  const dayAfterEnd = parseISODate(latest.endDate);
  dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
  return toISODate(firstWeekdayOnOrAfter(dayAfterEnd));
}

export function addDaysISO(startDate: string, days: number) {
  const date = parseISODate(startDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

const WINDOW_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

// "Aug 5 – Aug 18" (or "Aug 5 – 18" when both dates share a month).
export function formatSprintWindow(startDate: string, endDate: string) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const startLabel = start.toLocaleDateString("en-US", WINDOW_LABEL_FORMAT);
  const endLabel =
    start.getMonth() === end.getMonth()
      ? String(end.getDate())
      : end.toLocaleDateString("en-US", WINDOW_LABEL_FORMAT);
  return `${startLabel} – ${endLabel}`;
}

export const SPRINT_OUTCOME_MAX_LENGTH = 100;

// Highest sprint number among existing sprints, plus one — fixed and
// non-editable, so it keeps counting up regardless of deletions and never
// collides even if the user renames a sprint.
export function nextSprintNumber(sprints: Sprint[]) {
  return sprints.reduce((max, sprint) => Math.max(max, sprint.sprintNumber), 0) + 1;
}

// ─── Cell keys ────────────────────────────────────────────────────────────────
const CELL_SEPARATOR = "::";

export function cellKey(sprintId: string, featureId: string) {
  return `${sprintId}${CELL_SEPARATOR}${featureId}`;
}

function splitCellKey(key: string) {
  const at = key.indexOf(CELL_SEPARATOR);
  if (at < 0) return null;
  return {
    sprintId: key.slice(0, at),
    featureId: key.slice(at + CELL_SEPARATOR.length),
  };
}

// ─── Ordering ─────────────────────────────────────────────────────────────────
// The unassigned goal is always pinned to the far right of the backbone, and
// the catch-all feature to the right of its siblings, so triage never shifts
// the columns a user is actually planning against.
function reservedLast<T extends { id: string }>(
  items: T[],
  isReserved: (id: string) => boolean
) {
  const regular: T[] = [];
  const reserved: T[] = [];
  for (const item of items) {
    (isReserved(item.id) ? reserved : regular).push(item);
  }
  return { regular, reserved, ordered: [...regular, ...reserved] };
}

export function orderedGoals(goals: Goal[]) {
  return reservedLast(goals, isReservedGoalId).ordered;
}

export function featuresForGoal(features: Feature[], goalId: string) {
  return reservedLast(
    features.filter((feature) => feature.goalId === goalId),
    isReservedFeatureId
  ).ordered;
}

function swap<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// ─── Lazily materialised fallbacks ────────────────────────────────────────────
function withUnassignedGoal(goals: Goal[]): Goal[] {
  if (goals.some((goal) => goal.id === UNASSIGNED_GOAL_ID)) return goals;
  return [...goals, { id: UNASSIGNED_GOAL_ID, title: UNASSIGNED_GOAL_TITLE }];
}

function withUnassignedFeature(features: Feature[]): Feature[] {
  if (features.some((feature) => feature.id === UNASSIGNED_FEATURE_ID)) {
    return features;
  }
  return [
    ...features,
    {
      id: UNASSIGNED_FEATURE_ID,
      title: UNASSIGNED_FEATURE_TITLE,
      goalId: UNASSIGNED_GOAL_ID,
    },
  ];
}

// Drops the fallbacks again once they are empty, plus any cells left with no
// stories. Runs after every transition so the triage area only exists while it
// holds something — including after a drag rescues the last orphaned story.
export function prune(map: StoryMap): StoryMap {
  const storiesByCell = Object.fromEntries(
    Object.entries(map.storiesByCell).filter(([, stories]) => stories.length > 0)
  );

  const catchAllInUse = Object.keys(storiesByCell).some(
    (key) => splitCellKey(key)?.featureId === UNASSIGNED_FEATURE_ID
  );
  const features = catchAllInUse
    ? map.features
    : map.features.filter((feature) => !isReservedFeatureId(feature.id));

  const unassignedInUse = features.some(
    (feature) => feature.goalId === UNASSIGNED_GOAL_ID
  );
  const goals = unassignedInUse
    ? map.goals
    : map.goals.filter((goal) => !isReservedGoalId(goal.id));

  return { goals: orderedGoals(goals), features, storiesByCell };
}

// ─── Blast radius ─────────────────────────────────────────────────────────────
export type DeleteImpact = {
  featureCount: number;
  storyCount: number;
};

export function storyCountForFeature(map: StoryMap, featureId: string) {
  return Object.entries(map.storiesByCell).reduce(
    (total, [key, stories]) =>
      splitCellKey(key)?.featureId === featureId ? total + stories.length : total,
    0
  );
}

export function storyCountForSprint(map: StoryMap, sprintId: string) {
  return Object.entries(map.storiesByCell).reduce(
    (total, [key, stories]) =>
      splitCellKey(key)?.sprintId === sprintId ? total + stories.length : total,
    0
  );
}

export function goalDeleteImpact(map: StoryMap, goalId: string): DeleteImpact {
  const goalFeatures = map.features.filter(
    (feature) => feature.goalId === goalId
  );
  return {
    featureCount: goalFeatures.length,
    storyCount: goalFeatures.reduce(
      (total, feature) => total + storyCountForFeature(map, feature.id),
      0
    ),
  };
}

// ─── Transitions ──────────────────────────────────────────────────────────────

// Deleting a goal keeps its features intact and slides them under Unassigned.
// Stories are not touched at all: they keep both their feature column and
// their sprint row, so only the goal grouping is lost.
export function deleteGoal(map: StoryMap, goalId: string): StoryMap {
  if (isReservedGoalId(goalId)) return map;

  const goals = withUnassignedGoal(map.goals).filter((goal) => goal.id !== goalId);
  const features = map.features.map((feature) =>
    feature.goalId === goalId
      ? { ...feature, goalId: UNASSIGNED_GOAL_ID }
      : feature
  );

  return prune({ ...map, goals, features });
}

// Deleting a feature relocates its stories to `destinationFeatureId`
// (the catch-all column by default), preserving each story's sprint row.
export function deleteFeature(
  map: StoryMap,
  featureId: string,
  destinationFeatureId: string = UNASSIGNED_FEATURE_ID
): StoryMap {
  if (isReservedFeatureId(featureId)) return map;
  if (destinationFeatureId === featureId) return map;
  if (!map.features.some((feature) => feature.id === featureId)) return map;

  const storiesByCell: StoriesByCell = {};
  const relocatedBySprint = new Map<string, StoryItem[]>();

  for (const [key, stories] of Object.entries(map.storiesByCell)) {
    const parsed = splitCellKey(key);
    if (parsed?.featureId !== featureId) {
      storiesByCell[key] = stories;
      continue;
    }
    if (stories.length > 0) relocatedBySprint.set(parsed.sprintId, stories);
  }

  for (const [sprintId, stories] of relocatedBySprint) {
    const destinationKey = cellKey(sprintId, destinationFeatureId);
    storiesByCell[destinationKey] = [
      ...(storiesByCell[destinationKey] ?? []),
      ...stories,
    ];
  }

  const relocatedToCatchAll =
    relocatedBySprint.size > 0 &&
    destinationFeatureId === UNASSIGNED_FEATURE_ID;

  return prune({
    goals: relocatedToCatchAll ? withUnassignedGoal(map.goals) : map.goals,
    features: (relocatedToCatchAll
      ? withUnassignedFeature(map.features)
      : map.features
    ).filter((feature) => feature.id !== featureId),
    storiesByCell,
  });
}

// Deleting a sprint relocates its stories to the Backlog row (the sprint
// axis's fixed fallback — there's only ever one, unlike a feature delete's
// destination picker), preserving each story's feature column.
export function deleteSprintStories(map: StoryMap, sprintId: string): StoryMap {
  if (sprintId === BACKLOG_SPRINT_ID) return map;

  const storiesByCell: StoriesByCell = {};
  const relocatedByFeature = new Map<string, StoryItem[]>();

  for (const [key, stories] of Object.entries(map.storiesByCell)) {
    const parsed = splitCellKey(key);
    if (parsed?.sprintId !== sprintId) {
      storiesByCell[key] = stories;
      continue;
    }
    if (stories.length > 0) relocatedByFeature.set(parsed.featureId, stories);
  }

  for (const [featureId, stories] of relocatedByFeature) {
    const destinationKey = cellKey(BACKLOG_SPRINT_ID, featureId);
    storiesByCell[destinationKey] = [
      ...(storiesByCell[destinationKey] ?? []),
      ...stories,
    ];
  }

  return prune({ ...map, storiesByCell });
}

export function deleteSprint(sprints: Sprint[], sprintId: string): Sprint[] {
  return sprints.filter((sprint) => sprint.id !== sprintId);
}

export function updateSprint(
  sprints: Sprint[],
  sprintId: string,
  patch: {
    name: string;
    outcome: string;
    startDate: string;
    endDate: string;
  }
): Sprint[] {
  return sprints.map((sprint) =>
    sprint.id === sprintId
      ? {
          ...sprint,
          name: patch.name,
          outcome: patch.outcome,
          startDate: patch.startDate,
          endDate: patch.endDate,
          window: formatSprintWindow(patch.startDate, patch.endDate),
        }
      : sprint
  );
}

export function deleteStory(
  map: StoryMap,
  sprintId: string,
  featureId: string,
  storyId: string
): StoryMap {
  const key = cellKey(sprintId, featureId);
  const stories = map.storiesByCell[key];
  if (!stories) return map;

  return prune({
    ...map,
    storiesByCell: {
      ...map.storiesByCell,
      [key]: stories.filter((story) => story.id !== storyId),
    },
  });
}

// The escape hatch out of triage: without this, a feature reparented to
// Unassigned could only ever be reordered within it.
export function moveFeatureToGoal(
  map: StoryMap,
  featureId: string,
  goalId: string
): StoryMap {
  if (isReservedFeatureId(featureId)) return map;
  if (!map.goals.some((goal) => goal.id === goalId)) return map;

  return prune({
    ...map,
    features: map.features.map((feature) =>
      feature.id === featureId ? { ...feature, goalId } : feature
    ),
  });
}

export function moveGoal(
  map: StoryMap,
  goalId: string,
  direction: "left" | "right"
): StoryMap {
  if (isReservedGoalId(goalId)) return map;

  const { regular, reserved } = reservedLast(map.goals, isReservedGoalId);
  const from = regular.findIndex((goal) => goal.id === goalId);
  if (from < 0) return map;

  const to = direction === "left" ? from - 1 : from + 1;
  if (to < 0 || to >= regular.length) return map;

  return { ...map, goals: [...swap(regular, from, to), ...reserved] };
}

export function moveFeatureWithinGoal(
  map: StoryMap,
  goalId: string,
  featureId: string,
  direction: "left" | "right"
): StoryMap {
  if (isReservedFeatureId(featureId)) return map;

  const siblings = map.features.filter((feature) => feature.goalId === goalId);
  const { regular, reserved } = reservedLast(siblings, isReservedFeatureId);
  const from = regular.findIndex((feature) => feature.id === featureId);
  if (from < 0) return map;

  const to = direction === "left" ? from - 1 : from + 1;
  if (to < 0 || to >= regular.length) return map;

  // Splice the reordered siblings back into their original slots so features
  // belonging to other goals keep their positions.
  const reordered = [...swap(regular, from, to), ...reserved];
  let pointer = 0;
  const features = map.features.map((feature) =>
    feature.goalId === goalId ? reordered[pointer++] : feature
  );

  return { ...map, features };
}

// ─── Drag & drop ──────────────────────────────────────────────────────────────
export function moveStory(
  map: StoryMap,
  source: { sprintId: string; featureId: string },
  target: { sprintId: string; featureId: string },
  storyId: string,
  beforeStoryId?: string
): StoryMap {
  const sourceKey = cellKey(source.sprintId, source.featureId);
  const targetKey = cellKey(target.sprintId, target.featureId);

  if (sourceKey === targetKey) {
    const items = map.storiesByCell[sourceKey] ?? [];
    const from = items.findIndex((story) => story.id === storyId);
    const to = items.findIndex((story) => story.id === beforeStoryId);
    if (from < 0 || to < 0 || from === to) return map;
    return {
      ...map,
      storiesByCell: { ...map.storiesByCell, [sourceKey]: swap(items, from, to) },
    };
  }

  const sourceItems = [...(map.storiesByCell[sourceKey] ?? [])];
  const targetItems = [...(map.storiesByCell[targetKey] ?? [])];

  const from = sourceItems.findIndex((story) => story.id === storyId);
  if (from < 0) return map;

  const [story] = sourceItems.splice(from, 1);
  const at = targetItems.findIndex((item) => item.id === beforeStoryId);
  if (at >= 0) {
    targetItems.splice(at, 0, story);
  } else {
    targetItems.push(story);
  }

  return prune({
    ...map,
    storiesByCell: {
      ...map.storiesByCell,
      [sourceKey]: sourceItems,
      [targetKey]: targetItems,
    },
  });
}
