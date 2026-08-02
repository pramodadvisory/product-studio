"use client";

import { Fragment, useMemo, useState } from "react";
import { useHeaderTitle, HeaderActions } from "@/components/header-title-context";
import {
  closestCorners,
  pointerWithin,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  ArrowLeftRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Flag,
  GripVertical,
  Inbox,
  Layers,
  MoreVertical,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initialSprints, initialStoryMap } from "./seed-data";
import { useColumnFlip } from "./use-column-flip";
import {
  BACKLOG_SPRINT_ID,
  cellKey,
  deleteFeature,
  deleteGoal,
  deleteStory,
  featuresForGoal,
  goalDeleteImpact,
  isReservedFeatureId,
  isReservedGoalId,
  moveFeatureToGoal,
  moveFeatureWithinGoal,
  moveGoal,
  moveStory,
  orderedGoals,
  storyCountForFeature,
  UNASSIGNED_FEATURE_ID,
  UNASSIGNED_GOAL_ID,
  type Feature,
  type Sprint,
  type StoryItem,
  type StoryMap,
} from "./storymap";

// ─── Status / Priority Config ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  done: {
    label: "Done",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
} as const;

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

const HEADER_BUTTON_CLASS =
  "inline-flex h-5 w-5 items-center justify-center rounded border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed";

// A pending delete the user still has to confirm.
type DeleteTarget =
  | { kind: "goal"; id: string }
  | { kind: "feature"; id: string }
  | null;

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// ─── Drag resolution ──────────────────────────────────────────────────────────
// closestCorners measures from the dragged card's rect, so a tall card is often
// "closest" to a cell the cursor isn't over — the gap would open somewhere the
// user isn't pointing. Resolve from the pointer instead, and only fall back to
// geometry when the pointer has left every cell (e.g. dragged past the edge).
// pointerWithin returns nested hits nearest-first, so a hovered card wins over
// its containing cell, and an empty area of a cell resolves to the cell itself.
const boardCollisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCorners(args);
};

// Both the live placeholder and the actual drop read the target from here, so
// the gap the user sees is guaranteed to be where the card actually lands.
type Cell = { sprintId: string; featureId: string };

function cellOf(node: { data: { current?: unknown } }): Cell | null {
  const data = node.data.current as Partial<Cell> | undefined;
  return data?.sprintId && data.featureId
    ? { sprintId: data.sprintId, featureId: data.featureId }
    : null;
}

// `over` is either a cell droppable (drop at the end) or another story card
// (drop before it) — mirroring how moveStory() splices.
function resolveDrop(
  active: { id: string | number; data: { current?: unknown } },
  over: { id: string | number; data: { current?: unknown } } | null
): { cell: Cell; beforeStoryId: string } | null {
  if (!over || over.id === active.id) return null;
  const cell = cellOf(over);
  return cell ? { cell, beforeStoryId: String(over.id) } : null;
}

// The gap that opens where the card will land.
function DropPlaceholder({ height }: { height: number }) {
  return (
    <div
      aria-hidden
      style={height > 0 ? { height } : undefined}
      className="animate-in fade-in zoom-in-95 duration-150 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 min-h-16"
    />
  );
}

// ─── DroppableCell ────────────────────────────────────────────────────────────
function DroppableCell({
  sprintId,
  featureId,
  children,
  className,
}: {
  sprintId: string;
  featureId: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Registers the cell as a drop target. There's deliberately no hover
  // styling — the drop gap alone shows where the card is going.
  const { setNodeRef } = useDroppable({
    id: `drop::${cellKey(sprintId, featureId)}`,
    data: { type: "cell", sprintId, featureId },
  });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

// ─── StoryCard ────────────────────────────────────────────────────────────────
// The card visual, with no drag wiring — shared by the in-grid sortable card
// and the DragOverlay copy that follows the cursor, so the thing being carried
// is pixel-identical to the thing that was picked up.
function StoryCard({
  story,
  handleProps,
  onDelete,
  lifted,
}: {
  story: StoryItem;
  handleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onDelete?: () => void;
  lifted?: boolean;
}) {
  const status = story.status ?? "todo";
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="group/story">
      <Card
        className={cn(
          "overflow-hidden transition-shadow duration-150 bg-gray-50 dark:bg-slate-900/30",
          lifted ? "shadow-2xl ring-2 ring-primary/30" : "hover:shadow-sm"
        )}
      >
        <div className="flex gap-2">
          {/* Drag handle on left */}
          <button
            type="button"
            aria-label="Drag to move"
            className="flex items-center justify-center px-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing shrink-0"
            {...handleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Content */}
          <CardContent className="flex-1 py-3 pr-3">
            <div className="space-y-2 break-words">
              {/* Story key + actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {story.storyKey ?? story.id.replace("story-", "AS-")}
                </div>
                {onDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Actions for ${story.storyKey ?? "story"}`}
                      className="-mt-0.5 -mr-1 shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/story:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem variant="destructive" onClick={onDelete}>
                        <Trash2 />
                        Delete story
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Story text */}
              <p className="text-sm text-foreground line-clamp-3">
                {story.text}
              </p>

              {/* Status + points */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs px-2 py-1 rounded", statusCfg.className)}>
                  {statusCfg.label}
                </span>
                {story.storyPoints != null && (
                  <span className="text-xs text-muted-foreground">
                    {story.storyPoints} pts
                  </span>
                )}
              </div>

              {/* Assignee */}
              {story.assignee && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="font-medium text-[11px]">
                      {story.assignee.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate">{story.assignee}</span>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

// ─── SortableStoryCard ────────────────────────────────────────────────────────
function SortableStoryCard({
  story,
  sprintId,
  featureId,
  onDelete,
}: {
  story: StoryItem;
  sprintId: string;
  featureId: string;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id,
    data: { sprintId, featureId },
  });

  return (
    <div
      ref={setNodeRef}
      data-story-id={story.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // While dragging, the DragOverlay copy is the card the user is carrying;
      // this one stays put as a faded "came from here" ghost.
      className={cn(isDragging && "opacity-30")}
    >
      <StoryCard
        story={story}
        handleProps={{ ...attributes, ...listeners }}
        onDelete={onDelete}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  useHeaderTitle("Tasks & Story Map");

  const [map, setMap] = useState<StoryMap>(initialStoryMap);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const { goals, features, storiesByCell } = map;

  const [activeModal, setActiveModal] = useState<
    "sprint" | "goal" | "feature" | "story" | null
  >(null);
  // `target` and `snapshot` outlive `open` so the dialog can animate out
  // showing what it was about, rather than flashing an empty other-branch.
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    target: DeleteTarget;
    snapshot: StoryMap;
  }>({ open: false, target: null, snapshot: initialStoryMap });
  const [storyDestinationId, setStoryDestinationId] = useState(UNASSIGNED_FEATURE_ID);

  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintWindow, setNewSprintWindow] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newStoryText, setNewStoryText] = useState("");

  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState("");

  const { containerRef: boardRef, captureColumns } = useColumnFlip();

  const [drag, setDrag] = useState<{
    story: StoryItem;
    from: Cell;
    height: number;
    over: { cell: Cell; beforeStoryId: string } | null;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Only real goals/features can be picked as parents or targets — the
  // fallbacks are somewhere work lands, never somewhere you file it.
  const assignableGoals = useMemo(
    () => goals.filter((goal) => !isReservedGoalId(goal.id)),
    [goals]
  );
  const assignableFeatures = useMemo(
    () => features.filter((feature) => !isReservedFeatureId(feature.id)),
    [features]
  );

  // Selections are resolved rather than stored, so deleting whatever was
  // selected can never leave a form pointing at something that is gone.
  const activeGoalId = assignableGoals.some((g) => g.id === selectedGoalId)
    ? selectedGoalId
    : assignableGoals[0]?.id ?? "";
  const activeFeatureId = assignableFeatures.some((f) => f.id === selectedFeatureId)
    ? selectedFeatureId
    : assignableFeatures[0]?.id ?? "";
  const activeSprintId =
    selectedSprintId === BACKLOG_SPRINT_ID ||
    sprints.some((s) => s.id === selectedSprintId)
      ? selectedSprintId
      : sprints[0]?.id ?? BACKLOG_SPRINT_ID;

  const goalColumns = useMemo(() => {
    let currentIdx = 0;
    return orderedGoals(goals).map((goal) => {
      const colCount = Math.max(1, featuresForGoal(features, goal.id).length);
      const start = currentIdx + 2;
      const end = start + colCount;
      currentIdx += colCount;
      return { ...goal, colCount, start, end };
    });
  }, [goals, features]);

  const unassignedStoryCount = useMemo(
    () =>
      features
        .filter((feature) => feature.goalId === UNASSIGNED_GOAL_ID)
        .reduce(
          (total, feature) => total + storyCountForFeature(map, feature.id),
          0
        ),
    [features, map]
  );

  // ─── Mutation helper ───────────────────────────────────────────────────────
  // Every destructive action routes through here: one atomic transition plus a
  // snapshot restore, which is all undo needs while state lives in memory.
  const applyWithUndo = (next: StoryMap, message: string, description?: string) => {
    const snapshot = map;
    setMap(next);
    toast(message, {
      description,
      action: {
        label: "Undo",
        onClick: () => setMap(snapshot),
      },
    });
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const addSprint = () => {
    const name = newSprintName.trim();
    if (!name) return;
    const id = `sprint-${Date.now()}`;
    setSprints((prev) => [
      ...prev,
      { id, name, window: newSprintWindow.trim() || "Upcoming" },
    ]);
    setSelectedSprintId(id);
    setNewSprintName("");
    setNewSprintWindow("");
    setActiveModal(null);
  };

  const addGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;
    const id = `goal-${Date.now()}`;
    setMap((prev) => ({ ...prev, goals: [...prev.goals, { id, title }] }));
    setSelectedGoalId(id);
    setNewGoalTitle("");
    setActiveModal(null);
  };

  const addFeature = () => {
    const title = newFeatureTitle.trim();
    if (!title || !activeGoalId) return;
    const id = `feature-${Date.now()}`;
    setMap((prev) => ({
      ...prev,
      features: [...prev.features, { id, title, goalId: activeGoalId }],
    }));
    setSelectedFeatureId(id);
    setNewFeatureTitle("");
    setActiveModal(null);
  };

  const insertStory = (sprintId: string, featureId: string, text: string) => {
    const story: StoryItem = {
      id: `story-${Date.now()}`,
      text,
      status: "todo",
      storyKey: `AS-${Date.now() % 1000}`,
    };
    const key = cellKey(sprintId, featureId);
    setMap((prev) => ({
      ...prev,
      storiesByCell: {
        ...prev.storiesByCell,
        [key]: [...(prev.storiesByCell[key] ?? []), story],
      },
    }));
  };

  const addStory = () => {
    const text = newStoryText.trim();
    if (!text || !activeSprintId || !activeFeatureId) return;
    insertStory(activeSprintId, activeFeatureId, text);
    setNewStoryText("");
    setActiveModal(null);
  };

  const addStoryToCell = (sprintId: string, featureId: string) => {
    const text = window.prompt("New User Story / Task:");
    if (!text?.trim()) return;
    insertStory(sprintId, featureId, text.trim());
  };

  // ─── Reordering ────────────────────────────────────────────────────────────
  // Each of these captures column positions first so the FLIP effect can slide
  // the affected columns to their new slots instead of teleporting them.
  const handleMoveGoal = (goalId: string, direction: "left" | "right") => {
    captureColumns();
    setMap((prev) => moveGoal(prev, goalId, direction));
  };

  const handleMoveFeature = (
    goalId: string,
    featureId: string,
    direction: "left" | "right"
  ) => {
    captureColumns();
    setMap((prev) => moveFeatureWithinGoal(prev, goalId, featureId, direction));
  };

  const handleMoveFeatureToGoal = (feature: Feature, goalId: string) => {
    const goalTitle = goals.find((goal) => goal.id === goalId)?.title ?? "goal";
    captureColumns();
    applyWithUndo(
      moveFeatureToGoal(map, feature.id, goalId),
      `Moved "${feature.title}" to ${goalTitle}`
    );
  };

  // ─── Deletion ──────────────────────────────────────────────────────────────
  const requestDelete = (target: NonNullable<DeleteTarget>) => {
    if (target.kind === "feature") setStoryDestinationId(UNASSIGNED_FEATURE_ID);
    setDeleteDialog({ open: true, target, snapshot: map });
  };

  const closeDeleteDialog = () =>
    setDeleteDialog((prev) => ({ ...prev, open: false }));

  const confirmDelete = () => {
    const target = deleteDialog.target;
    if (!target) return;

    if (target.kind === "goal") {
      const goal = goals.find((g) => g.id === target.id);
      const impact = goalDeleteImpact(map, target.id);
      applyWithUndo(
        deleteGoal(map, target.id),
        `Deleted goal "${goal?.title ?? ""}"`,
        impact.featureCount > 0
          ? `${pluralize(impact.featureCount, "feature")} moved to Unassigned.`
          : undefined
      );
    } else {
      const feature = features.find((f) => f.id === target.id);
      const storyCount = storyCountForFeature(map, target.id);
      const destinationTitle =
        storyDestinationId === UNASSIGNED_FEATURE_ID
          ? "Unassigned"
          : features.find((f) => f.id === storyDestinationId)?.title ?? "Unassigned";
      applyWithUndo(
        deleteFeature(map, target.id, storyDestinationId),
        `Deleted feature "${feature?.title ?? ""}"`,
        storyCount > 0
          ? `${pluralize(storyCount, "story", "stories")} moved to ${destinationTitle}, sprints kept.`
          : undefined
      );
    }

    closeDeleteDialog();
  };

  const handleDeleteStory = (
    sprintId: string,
    featureId: string,
    story: StoryItem
  ) =>
    applyWithUndo(
      deleteStory(map, sprintId, featureId, story.id),
      `Deleted ${story.storyKey ?? "story"}`,
      story.text
    );

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => {
    const from = cellOf(active);
    if (!from) return;
    const story = (storiesByCell[cellKey(from.sprintId, from.featureId)] ?? []).find(
      (s) => s.id === active.id
    );
    if (!story) return;
    setDrag({
      story,
      from,
      // Size the placeholder to the card being carried so the gap that opens
      // is exactly the space it will occupy. active.rect isn't measured yet at
      // drag start, so read the node itself.
      height:
        document
          .querySelector(`[data-story-id="${active.id}"]`)
          ?.getBoundingClientRect().height ?? 0,
      over: null,
    });
  };

  const handleDragOver = ({ active, over }: DragOverEvent) =>
    setDrag((prev) =>
      prev ? { ...prev, over: resolveDrop(active, over) } : prev
    );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDrag(null);

    const from = cellOf(active);
    const to = resolveDrop(active, over);
    if (!from || !to) return;

    setMap((prev) =>
      moveStory(prev, from, to.cell, String(active.id), to.beforeStoryId)
    );
  };

  const totalGoalColumns = goalColumns.reduce((sum, g) => sum + g.colCount, 0);
  const gridTemplateColumnsString = `200px ${Array(totalGoalColumns)
    .fill("minmax(240px, 1fr)")
    .join(" ")}`;

  const renderCellContent = (sprintId: string, featureId: string) => {
    const key = cellKey(sprintId, featureId);
    const laneStories = storiesByCell[key] ?? [];

    // Only preview cross-cell drops. Within one cell the sortable strategy
    // already slides the siblings apart, so a placeholder would double up.
    const target = drag?.over?.cell;
    const isTarget =
      !!target &&
      target.sprintId === sprintId &&
      target.featureId === featureId &&
      !(drag.from.sprintId === sprintId && drag.from.featureId === featureId);

    const placeholderAt = isTarget
      ? (() => {
          const idx = laneStories.findIndex(
            (s) => s.id === drag.over!.beforeStoryId
          );
          return idx >= 0 ? idx : laneStories.length; // no match → appended
        })()
      : -1;

    return (
      <DroppableCell
        sprintId={sprintId}
        featureId={featureId}
        className="flex flex-col justify-between h-full"
      >
        <SortableContext
          items={laneStories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {laneStories.map((story, index) => (
              <Fragment key={story.id}>
                {placeholderAt === index && (
                  <DropPlaceholder height={drag!.height} />
                )}
                <SortableStoryCard
                  story={story}
                  sprintId={sprintId}
                  featureId={featureId}
                  onDelete={() => handleDeleteStory(sprintId, featureId, story)}
                />
              </Fragment>
            ))}
            {placeholderAt >= laneStories.length && (
              <DropPlaceholder height={drag!.height} />
            )}
          </div>
        </SortableContext>

        <button
          type="button"
          className="group mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-background/40 py-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground hover:border-primary/20 active:scale-[0.98] transition-all duration-150"
          onClick={() => addStoryToCell(sprintId, featureId)}
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary" />
          <span>Add Story</span>
        </button>
      </DroppableCell>
    );
  };

  // Walks the backbone once and renders one cell per feature column, so every
  // row (sprints, backlog header, backlog cells) stays aligned to the grid.
  const renderFeatureCells = (
    keyPrefix: string,
    render: (feature: Feature, goalId: string) => React.ReactNode,
    emptyClassName: string
  ) =>
    goalColumns.map((goal) => {
      const goalFeatures = featuresForGoal(features, goal.id);
      if (goalFeatures.length === 0) {
        return (
          <div
            key={`${keyPrefix}-empty-${goal.id}`}
            data-flip-key={`${keyPrefix}-empty-${goal.id}`}
            className={emptyClassName}
          />
        );
      }
      return goalFeatures.map((feature) => (
        <div
          key={`${keyPrefix}-${feature.id}`}
          data-flip-key={`${keyPrefix}-${feature.id}`}
          className={emptyClassName}
        >
          {render(feature, goal.id)}
        </div>
      ));
    });

  const { target: shownTarget, snapshot: shownSnapshot } = deleteDialog;

  const deletingGoal =
    shownTarget?.kind === "goal"
      ? shownSnapshot.goals.find((goal) => goal.id === shownTarget.id)
      : undefined;
  const deletingGoalImpact =
    shownTarget?.kind === "goal"
      ? goalDeleteImpact(shownSnapshot, shownTarget.id)
      : null;
  const deletingFeature =
    shownTarget?.kind === "feature"
      ? shownSnapshot.features.find((feature) => feature.id === shownTarget.id)
      : undefined;
  const deletingFeatureStoryCount =
    shownTarget?.kind === "feature"
      ? storyCountForFeature(shownSnapshot, shownTarget.id)
      : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderActions>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveModal("sprint")}>
          <Plus className="h-3.5 w-3.5" />
          Sprint
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveModal("goal")}>
          <Target className="h-3.5 w-3.5 text-sky-600" />
          Goal
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveModal("feature")}>
          <Layers className="h-3.5 w-3.5 text-indigo-600" />
          Feature
        </Button>
        <Button
          size="sm"
          className="gap-1.5 shadow-sm"
          onClick={() => {
            if (assignableGoals.length === 0 || assignableFeatures.length === 0) {
              alert("Please add at least one Goal and Feature first!");
              return;
            }
            setActiveModal("story");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Story
        </Button>
      </HeaderActions>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-4 lg:p-6">
        {/* Story Mapping Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={boardCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDrag(null)}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/10 shadow-xs">
            {/* Board toolbar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CalendarRange className="h-3 w-3" />
                  Sprint Stories
                </Badge>
                <div className="h-4 w-px bg-border/60" />
                <Badge variant="outline" className="gap-1 text-xs">
                  <Flag className="h-3 w-3" />
                  {sprints.length} Sprints
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Target className="h-3 w-3 text-sky-500" />
                  {assignableGoals.length} Goals
                </Badge>
                {unassignedStoryCount > 0 && (
                  <Badge variant="outline" className="gap-1 text-xs border-dashed">
                    <Inbox className="h-3 w-3 text-muted-foreground" />
                    {unassignedStoryCount} Unassigned
                  </Badge>
                )}
              </div>
              <p className="hidden text-xs text-muted-foreground sm:inline-block">
                Drag stories across sprints, goals, or into the backlog.
              </p>
            </div>

            {features.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold">
                  Storyboard is empty
                </h3>
                <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                  Get started by adding a user Goal, inserting your product
                  Features, and mapping user Stories beneath them.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setActiveModal("goal")}>
                    Add Goal
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal("feature")}
                  >
                    Add Feature
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <div ref={boardRef} className="min-w-[1220px]">

                  {/* ── Row 1: Goal Backbone (sticky, light gray) ─────────── */}
                  <div
                    className="sticky top-0 z-40 grid h-10 border-b border-border/70 bg-gray-100 dark:bg-neutral-900 font-medium text-xs uppercase"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="sticky left-0 z-50 flex items-center border-r border-border/70 bg-gray-100 dark:bg-neutral-900 px-5 font-bold tracking-wider text-muted-foreground backdrop-blur shadow-xs">
                      The Backbone
                    </div>
                    {goalColumns.map((goal, goalIndex) => {
                      const reserved = isReservedGoalId(goal.id);
                      const lastAssignableIndex = goalColumns.findLastIndex(
                        (column) => !isReservedGoalId(column.id)
                      );
                      return (
                        <div
                          key={goal.id}
                          data-flip-key={`goal-header-${goal.id}`}
                          className="flex items-center border-r border-border/70 bg-gray-100 dark:bg-neutral-900 px-5"
                          style={{ gridColumn: `${goal.start} / ${goal.end}` }}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <div
                              className={cn(
                                "flex min-w-0 items-center gap-1.5 font-semibold",
                                reserved
                                  ? "text-muted-foreground"
                                  : "text-sky-700 dark:text-sky-300"
                              )}
                            >
                              {reserved ? (
                                <Inbox className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Target className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className="truncate">{goal.title}</span>
                            </div>
                            {!reserved && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  aria-label={`Actions for goal ${goal.title}`}
                                  className={HEADER_BUTTON_CLASS}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    disabled={goalIndex === 0}
                                    onClick={() => handleMoveGoal(goal.id, "left")}
                                  >
                                    <ChevronLeft />
                                    Move left
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={goalIndex >= lastAssignableIndex}
                                    onClick={() => handleMoveGoal(goal.id, "right")}
                                  >
                                    <ChevronRight />
                                    Move right
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      requestDelete({ kind: "goal", id: goal.id })
                                    }
                                  >
                                    <Trash2 />
                                    Delete goal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Row 2: Feature Headers (sticky, light gray) ────────── */}
                  <div
                    className="sticky top-10 z-30 grid h-12 border-b border-border/70 bg-gray-50 dark:bg-neutral-800/80"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="sticky left-0 z-40 flex items-center border-r border-border/70 bg-gray-50 dark:bg-neutral-800/80 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur shadow-xs">
                      Sprints &amp; Actions
                    </div>
                    {goalColumns.map((goal) => {
                      const goalFeatures = featuresForGoal(features, goal.id);
                      if (goalFeatures.length === 0) {
                        return (
                          <div
                            key={`empty-${goal.id}`}
                            data-flip-key={`feature-header-empty-${goal.id}`}
                            className="border-r border-border/70 px-5 bg-gray-50 dark:bg-neutral-800/80"
                          />
                        );
                      }
                      const lastAssignableIndex = goalFeatures.findLastIndex(
                        (feature) => !isReservedFeatureId(feature.id)
                      );
                      return goalFeatures.map((feature, featureIndex) => {
                        const reserved = isReservedFeatureId(feature.id);
                        const otherGoals = assignableGoals.filter(
                          (candidate) => candidate.id !== feature.goalId
                        );
                        return (
                          <div
                            key={feature.id}
                            data-flip-key={`feature-header-${feature.id}`}
                            className="flex items-center border-r border-border/70 px-5 bg-gray-50 dark:bg-neutral-800/80"
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <div
                                className={cn(
                                  "flex min-w-0 items-center gap-1.5 font-semibold",
                                  reserved
                                    ? "text-muted-foreground"
                                    : "text-primary/80"
                                )}
                              >
                                <Layers
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    reserved
                                      ? "text-muted-foreground/60"
                                      : "text-indigo-500/80"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "truncate text-sm tracking-tight",
                                    reserved && "italic font-normal"
                                  )}
                                >
                                  {feature.title}
                                </span>
                              </div>
                              {!reserved && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    aria-label={`Actions for feature ${feature.title}`}
                                    className={HEADER_BUTTON_CLASS}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem
                                      disabled={featureIndex === 0}
                                      onClick={() =>
                                        handleMoveFeature(goal.id, feature.id, "left")
                                      }
                                    >
                                      <ChevronLeft />
                                      Move left
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={featureIndex >= lastAssignableIndex}
                                      onClick={() =>
                                        handleMoveFeature(goal.id, feature.id, "right")
                                      }
                                    >
                                      <ChevronRight />
                                      Move right
                                    </DropdownMenuItem>
                                    {otherGoals.length > 0 && (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <ArrowLeftRight />
                                          Move to goal
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="w-52">
                                          <DropdownMenuGroup>
                                            <DropdownMenuLabel>
                                              Reassign under
                                            </DropdownMenuLabel>
                                            {otherGoals.map((candidate) => (
                                              <DropdownMenuItem
                                                key={candidate.id}
                                                onClick={() =>
                                                  handleMoveFeatureToGoal(
                                                    feature,
                                                    candidate.id
                                                  )
                                                }
                                              >
                                                <Target />
                                                <span className="truncate">
                                                  {candidate.title}
                                                </span>
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuGroup>
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() =>
                                        requestDelete({
                                          kind: "feature",
                                          id: feature.id,
                                        })
                                      }
                                    >
                                      <Trash2 />
                                      Delete feature
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>

                  {/* ── Sprint Rows ─────────────────────────────────────────── */}
                  {sprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="grid border-b border-border/60 hover:bg-muted/5 transition-colors duration-150"
                      style={{ gridTemplateColumns: gridTemplateColumnsString }}
                    >
                      <div className="sticky left-0 z-20 border-r border-border/70 bg-background/95 px-5 py-5 flex flex-col justify-center backdrop-blur shadow-xs">
                        <p className="text-sm font-bold tracking-tight">
                          {sprint.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          {sprint.window}
                        </p>
                      </div>

                      {renderFeatureCells(
                        `sprint-${sprint.id}`,
                        (feature) => renderCellContent(sprint.id, feature.id),
                        "border-r border-border/60 p-3 last:border-r-0 bg-card/10"
                      )}
                    </div>
                  ))}

                  {/* ── Backlog Row ─────────────────────────────────────────── */}
                  <div className="border-t-2 border-dashed border-border/60">
                    {/* Backlog section header */}
                    <div
                      className="grid border-b border-border/60 bg-amber-50/70 dark:bg-amber-950/20"
                      style={{ gridTemplateColumns: gridTemplateColumnsString }}
                    >
                      <div className="sticky left-0 z-20 border-r border-border/70 bg-amber-50/70 dark:bg-amber-950/20 px-5 py-2.5 flex items-center gap-2 backdrop-blur shadow-xs">
                        <Archive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
                          Backlog
                        </span>
                      </div>
                      {renderFeatureCells(
                        "bl-feat",
                        (feature) => (
                          <span className="text-[11px] text-muted-foreground/70 italic">
                            {feature.title}
                          </span>
                        ),
                        "border-r border-border/60 px-5 py-2.5 last:border-r-0"
                      )}
                    </div>

                    {/* Backlog story cells */}
                    <div
                      className="grid border-b border-border/60 bg-amber-50/30 dark:bg-amber-950/10"
                      style={{ gridTemplateColumns: gridTemplateColumnsString }}
                    >
                      <div className="sticky left-0 z-20 border-r border-border/70 bg-amber-50/70 dark:bg-amber-950/20 px-5 py-4 flex flex-col justify-center backdrop-blur">
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          Unscheduled
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Drag here to defer
                        </p>
                      </div>

                      {renderFeatureCells(
                        "bl-cell",
                        (feature) =>
                          renderCellContent(BACKLOG_SPRINT_ID, feature.id),
                        "border-r border-border/60 p-3 last:border-r-0"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* The card the user is actually carrying — a portalled copy that
              tracks the pointer across cells, which the in-grid sortable node
              can't do because the list strategy pins it to its own column. */}
          <DragOverlay dropAnimation={{ duration: 200, easing: EASE_OUT }}>
            {drag && (
              <div className="rotate-2 cursor-grabbing">
                <StoryCard story={drag.story} lifted />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* ── DIALOG MODALS ──────────────────────────────────────────────────── */}

        <Dialog
          open={activeModal === "sprint"}
          onOpenChange={(open) => !open && setActiveModal(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sprint Row</DialogTitle>
              <DialogDescription>
                Create a vertical row to organize sprint delivery targets.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3.5 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="sprint-name">Sprint Name</Label>
                <Input
                  id="sprint-name"
                  placeholder="e.g. Sprint 5"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sprint-window">Time Window</Label>
                <Input
                  id="sprint-window"
                  placeholder="e.g. Week 9-10"
                  value={newSprintWindow}
                  onChange={(e) => setNewSprintWindow(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={addSprint} disabled={!newSprintName.trim()}>
                Create Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={activeModal === "goal"}
          onOpenChange={(open) => !open && setActiveModal(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Goal</DialogTitle>
              <DialogDescription>
                Goals organize features horizontally in your story map backbone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3.5 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g. Enhance Team Collaboration"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={addGoal} disabled={!newGoalTitle.trim()}>
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={activeModal === "feature"}
          onOpenChange={(open) => !open && setActiveModal(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product Feature</DialogTitle>
              <DialogDescription>
                Identify features underneath specific backbone goals.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3.5 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="parent-goal">Parent Goal</Label>
                <select
                  id="parent-goal"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none"
                  value={activeGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                >
                  {assignableGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feature-title">Feature Title</Label>
                <Input
                  id="feature-title"
                  placeholder="e.g. Workspace Templates"
                  value={newFeatureTitle}
                  onChange={(e) => setNewFeatureTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={addFeature}
                disabled={!newFeatureTitle.trim() || !activeGoalId}
              >
                Create Feature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={activeModal === "story"}
          onOpenChange={(open) => !open && setActiveModal(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Story / Task</DialogTitle>
              <DialogDescription>
                Map concrete tasks to features and implementation runs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3.5 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="target-sprint">Target Sprint</Label>
                <select
                  id="target-sprint"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none"
                  value={activeSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                >
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.window})
                    </option>
                  ))}
                  <option value={BACKLOG_SPRINT_ID}>
                    Backlog (Unscheduled)
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="target-feature">Belongs to Feature</Label>
                <select
                  id="target-feature"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none"
                  value={activeFeatureId}
                  onChange={(e) => setSelectedFeatureId(e.target.value)}
                >
                  {assignableGoals.map((goal) => (
                    <optgroup key={goal.id} label={goal.title}>
                      {featuresForGoal(assignableFeatures, goal.id).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="story-text">User Story Description</Label>
                <Input
                  id="story-text"
                  placeholder="As a..., I can ... so that..."
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={addStory} disabled={!newStoryText.trim()}>
                Map Story
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete confirmation ────────────────────────────────────────────── */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => !open && closeDeleteDialog()}
        >
          <DialogContent>
            {shownTarget?.kind === "goal" ? (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Delete goal &ldquo;{deletingGoal?.title}&rdquo;?
                  </DialogTitle>
                  <DialogDescription>
                    {deletingGoalImpact && deletingGoalImpact.featureCount > 0 ? (
                      <>
                        {pluralize(deletingGoalImpact.featureCount, "feature")} and{" "}
                        {pluralize(deletingGoalImpact.storyCount, "story", "stories")} move to{" "}
                        <span className="font-medium text-foreground">Unassigned</span>.
                        Feature columns and sprint rows are preserved — only the goal
                        grouping is removed.
                      </>
                    ) : (
                      "This goal has no features. Nothing else will be affected."
                    )}
                  </DialogDescription>
                </DialogHeader>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Delete feature &ldquo;{deletingFeature?.title}&rdquo;?
                  </DialogTitle>
                  <DialogDescription>
                    {deletingFeatureStoryCount > 0
                      ? `${pluralize(
                          deletingFeatureStoryCount,
                          "story",
                          "stories"
                        )} will be reassigned. Each story keeps its sprint row.`
                      : "This feature has no stories. Nothing else will be affected."}
                  </DialogDescription>
                </DialogHeader>
                {deletingFeatureStoryCount > 0 && (
                  <div className="space-y-1.5 py-1">
                    <Label htmlFor="story-destination">Move stories to</Label>
                    <select
                      id="story-destination"
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none"
                      value={storyDestinationId}
                      onChange={(e) => setStoryDestinationId(e.target.value)}
                    >
                      <option value={UNASSIGNED_FEATURE_ID}>
                        Unassigned (triage later)
                      </option>
                      {assignableGoals.map((goal) => {
                        const options = featuresForGoal(
                          assignableFeatures,
                          goal.id
                        ).filter((f) => f.id !== shownTarget?.id);
                        if (options.length === 0) return null;
                        return (
                          <optgroup key={goal.id} label={goal.title}>
                            {options.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.title}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                )}
              </>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {shownTarget?.kind === "goal" ? "Delete Goal" : "Delete Feature"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
