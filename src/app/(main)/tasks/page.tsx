"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Archive,
  CalendarRange,
  Flag,
  GripVertical,
  Layers,
  Plus,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKLOG_SPRINT_ID = "backlog";

// ─── Types ────────────────────────────────────────────────────────────────────
type Goal = {
  id: string;
  title: string;
};

type Feature = {
  id: string;
  title: string;
  goalId: string;
};

type Sprint = {
  id: string;
  name: string;
  window: string;
};

type StoryItem = {
  id: string;
  text: string;
  status?: "todo" | "in-progress" | "done" | "blocked";
  priority?: "low" | "medium" | "high";
  storyPoints?: number;
  storyKey?: string;
  assignee?: string;
};

type StoriesByCell = Record<string, StoryItem[]>;

function cellKey(sprintId: string, featureId: string) {
  return `${sprintId}::${featureId}`;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const initialGoals: Goal[] = [
  { id: "goal-1", title: "Acquire and activate users faster" },
  { id: "goal-2", title: "Improve planning confidence" },
  { id: "goal-3", title: "Increase predictable delivery" },
];

const initialFeatures: Feature[] = [
  { id: "feature-1", title: "Workspace setup", goalId: "goal-1" },
  { id: "feature-2", title: "Guided onboarding", goalId: "goal-1" },
  { id: "feature-3", title: "Story map board", goalId: "goal-2" },
  { id: "feature-4", title: "Dependency insights", goalId: "goal-3" },
  { id: "feature-5", title: "Sprint forecasting", goalId: "goal-3" },
];

const initialSprints: Sprint[] = [
  { id: "sprint-1", name: "Sprint 1", window: "Week 1-2" },
  { id: "sprint-2", name: "Sprint 2", window: "Week 3-4" },
  { id: "sprint-3", name: "Sprint 3", window: "Week 5-6" },
  { id: "sprint-4", name: "Sprint 4", window: "Week 7-8" },
];

const initialStoriesByCell: StoriesByCell = {
  [cellKey("sprint-1", "feature-1")]: [
    {
      id: "story-1",
      text: "As a PM, I can create a workspace in under 2 minutes",
      status: "done",
      priority: "high",
      storyPoints: 3,
      storyKey: "AS-1",
      assignee: "Alice",
    },
  ],
  [cellKey("sprint-1", "feature-2")]: [
    {
      id: "story-2",
      text: "As a new user, I can complete onboarding with contextual tips",
      status: "in-progress",
      priority: "high",
      storyPoints: 5,
      storyKey: "AS-2",
      assignee: "Bob",
    },
  ],
  [cellKey("sprint-2", "feature-3")]: [
    {
      id: "story-3",
      text: "As a team, we can prioritize stories with drag and drop",
      status: "in-progress",
      priority: "medium",
      storyPoints: 8,
      storyKey: "AS-3",
    },
  ],
  [cellKey("sprint-3", "feature-4")]: [
    {
      id: "story-4",
      text: "As a PM, I can see blocked stories due to dependencies",
      status: "todo",
      priority: "medium",
      storyPoints: 5,
      storyKey: "AS-4",
    },
  ],
  [cellKey("sprint-4", "feature-5")]: [
    {
      id: "story-5",
      text: "As leadership, I can compare planned vs delivered scope",
      status: "todo",
      priority: "low",
      storyPoints: 3,
      storyKey: "AS-5",
    },
  ],
  [cellKey(BACKLOG_SPRINT_ID, "feature-1")]: [
    {
      id: "story-6",
      text: "As a PM, I can invite team members via email link",
      status: "todo",
      priority: "medium",
      storyPoints: 2,
      storyKey: "AS-6",
    },
  ],
  [cellKey(BACKLOG_SPRINT_ID, "feature-3")]: [
    {
      id: "story-7",
      text: "As a user, I can filter the board by status or assignee",
      status: "todo",
      priority: "low",
      storyPoints: 3,
      storyKey: "AS-7",
    },
  ],
};

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

const PRIORITY_CONFIG = {
  high: { label: "High", barColor: "bg-red-400", textColor: "text-red-500" },
  medium: { label: "Med", barColor: "bg-amber-400", textColor: "text-amber-500" },
  low: { label: "Low", barColor: "bg-sky-300", textColor: "text-sky-500" },
} as const;

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
  const { setNodeRef, isOver } = useDroppable({
    id: `drop::${cellKey(sprintId, featureId)}`,
    data: { type: "cell", sprintId, featureId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "bg-primary/5 ring-1 ring-inset ring-primary/20 rounded-sm"
      )}
    >
      {children}
    </div>
  );
}

// ─── SortableStoryCard ────────────────────────────────────────────────────────
function SortableStoryCard({
  story,
  sprintId,
  featureId,
}: {
  story: StoryItem;
  sprintId: string;
  featureId: string;
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

  const status = story.status ?? "todo";
  const statusCfg = STATUS_CONFIG[status];
  const priorityCfg = story.priority ? PRIORITY_CONFIG[story.priority] : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging ? "opacity-40 z-50" : "opacity-100")}
    >
      <Card className="relative bg-gray-50 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 shadow-none hover:shadow-sm hover:border-primary/30 transition-all duration-150 overflow-hidden">
        {/* Priority color bar on left edge */}
        {priorityCfg && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-[3px]",
              priorityCfg.barColor
            )}
          />
        )}
        <CardContent
          className={cn(
            "py-2.5 pr-3 space-y-1.5",
            priorityCfg ? "pl-3.5" : "pl-3"
          )}
        >
          {/* Row 1: Story key + drag handle */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded leading-tight">
              {story.storyKey ?? story.id.replace("story-", "AS-")}
            </span>
            <button
              type="button"
              aria-label="Drag to move"
              className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 2: Story text */}
          <p className="text-xs leading-relaxed text-foreground/85 line-clamp-3">
            {story.text}
          </p>

          {/* Row 3: Status + priority label + points */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight",
                statusCfg.className
              )}
            >
              {statusCfg.label}
            </span>
            {priorityCfg && (
              <span
                className={cn(
                  "text-[10px] font-semibold leading-tight",
                  priorityCfg.textColor
                )}
              >
                &#9650; {priorityCfg.label}
              </span>
            )}
            {story.storyPoints != null && (
              <span className="ml-auto text-[10px] font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded leading-tight tabular-nums">
                {story.storyPoints} pts
              </span>
            )}
          </div>

          {/* Row 4: Assignee avatar */}
          {story.assignee && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {story.assignee.charAt(0)}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {story.assignee}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [storiesByCell, setStoriesByCell] =
    useState<StoriesByCell>(initialStoriesByCell);

  const [activeModal, setActiveModal] = useState<
    "sprint" | "goal" | "feature" | "story" | null
  >(null);

  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintWindow, setNewSprintWindow] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newStoryText, setNewStoryText] = useState("");

  const [selectedGoalId, setSelectedGoalId] = useState(
    initialGoals[0]?.id ?? ""
  );
  const [selectedSprintId, setSelectedSprintId] = useState(
    initialSprints[0]?.id ?? ""
  );
  const [selectedFeatureId, setSelectedFeatureId] = useState(
    initialFeatures[0]?.id ?? ""
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const goalColumns = useMemo(() => {
    let currentIdx = 0;
    return goals.map((goal) => {
      const goalFeatures = features.filter((f) => f.goalId === goal.id);
      const colCount = Math.max(1, goalFeatures.length);
      const start = currentIdx + 2;
      const end = start + colCount;
      currentIdx += colCount;
      return { ...goal, colCount, start, end };
    });
  }, [goals, features]);

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
    setGoals((prev) => [...prev, { id, title }]);
    setSelectedGoalId(id);
    setNewGoalTitle("");
    setActiveModal(null);
  };

  const addFeature = () => {
    const title = newFeatureTitle.trim();
    if (!title || !selectedGoalId) return;
    const id = `feature-${Date.now()}`;
    setFeatures((prev) => [...prev, { id, title, goalId: selectedGoalId }]);
    setSelectedFeatureId(id);
    setNewFeatureTitle("");
    setActiveModal(null);
  };

  const addStory = () => {
    const text = newStoryText.trim();
    if (!text || !selectedSprintId || !selectedFeatureId) return;
    const key = cellKey(selectedSprintId, selectedFeatureId);
    const story: StoryItem = {
      id: `story-${Date.now()}`,
      text,
      status: "todo",
      storyKey: `AS-${Date.now() % 1000}`,
    };
    setStoriesByCell((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), story],
    }));
    setNewStoryText("");
    setActiveModal(null);
  };

  const addStoryToCell = (sprintId: string, featureId: string) => {
    const text = window.prompt("New User Story / Task:");
    if (!text?.trim()) return;
    const key = cellKey(sprintId, featureId);
    const story: StoryItem = {
      id: `story-${Date.now()}`,
      text: text.trim(),
      status: "todo",
      storyKey: `AS-${Date.now() % 1000}`,
    };
    setStoriesByCell((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), story],
    }));
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const activeData = active.data.current as
      | { sprintId?: string; featureId?: string }
      | undefined;
    if (!activeData?.sprintId || !activeData.featureId) return;

    const overData = over.data.current as
      | { type?: string; sprintId?: string; featureId?: string }
      | undefined;

    const targetSprintId = overData?.sprintId;
    const targetFeatureId = overData?.featureId;
    if (!targetSprintId || !targetFeatureId) return;

    const sourceKey = cellKey(activeData.sprintId, activeData.featureId);
    const targetKey = cellKey(targetSprintId, targetFeatureId);

    if (sourceKey === targetKey) {
      if (active.id === over.id) return;
      setStoriesByCell((prev) => {
        const items = prev[sourceKey] ?? [];
        const oldIndex = items.findIndex((s) => s.id === active.id);
        const newIndex = items.findIndex((s) => s.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return prev;
        return { ...prev, [sourceKey]: arrayMove(items, oldIndex, newIndex) };
      });
    } else {
      setStoriesByCell((prev) => {
        const sourceItems = [...(prev[sourceKey] ?? [])];
        const targetItems = [...(prev[targetKey] ?? [])];

        const storyIdx = sourceItems.findIndex((s) => s.id === active.id);
        if (storyIdx < 0) return prev;

        const [story] = sourceItems.splice(storyIdx, 1);
        const overIdx = targetItems.findIndex((s) => s.id === over.id);
        if (overIdx >= 0) {
          targetItems.splice(overIdx, 0, story);
        } else {
          targetItems.push(story);
        }

        return {
          ...prev,
          [sourceKey]: sourceItems,
          [targetKey]: targetItems,
        };
      });
    }
  };

  const totalGoalColumns = goalColumns.reduce((sum, g) => sum + g.colCount, 0);
  const gridTemplateColumnsString = `200px ${Array(totalGoalColumns)
    .fill("minmax(240px, 1fr)")
    .join(" ")}`;

  const renderCellContent = (sprintId: string, featureId: string) => {
    const key = cellKey(sprintId, featureId);
    const laneStories = storiesByCell[key] ?? [];
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
          <div className="space-y-2">
            {laneStories.map((story) => (
              <SortableStoryCard
                key={story.id}
                story={story}
                sprintId={sprintId}
                featureId={featureId}
              />
            ))}
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-4 lg:p-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold mb-1 tracking-tight">
              Tasks &amp; Story Map
            </h1>
            <p className="text-sm text-muted-foreground">
              Define the user journey backbone with goals and features, and map
              user stories to implementation sprints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveModal("sprint")}
            >
              <Plus className="h-3.5 w-3.5" />
              Sprint
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveModal("goal")}
            >
              <Target className="h-3.5 w-3.5 text-sky-600" />
              Goal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveModal("feature")}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              Feature
            </Button>
            <Button
              size="sm"
              className="gap-1.5 shadow-sm"
              onClick={() => {
                if (goals.length === 0 || features.length === 0) {
                  alert("Please add at least one Goal and Feature first!");
                  return;
                }
                setActiveModal("story");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Story
            </Button>
          </div>
        </div>

        {/* Story Mapping Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
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
                  {goals.length} Goals
                </Badge>
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
              <div className="min-h-0 flex-1 overflow-auto">
                <div className="min-w-[1220px]">

                  {/* ── Row 1: Goal Backbone (sticky, light gray) ─────────── */}
                  <div
                    className="sticky top-0 z-40 grid border-b border-border/70 bg-gray-100 dark:bg-neutral-900 font-medium text-xs uppercase"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="border-r border-border/70 bg-gray-100 dark:bg-neutral-900 px-5 py-2.5 font-bold tracking-wider text-muted-foreground">
                      The Backbone
                    </div>
                    {goalColumns.map((goal) => (
                      <div
                        key={goal.id}
                        className="border-r border-border/70 bg-gray-100 dark:bg-neutral-900 px-5 py-2.5"
                        style={{ gridColumn: `${goal.start} / ${goal.end}` }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-300">
                          <Target className="h-3.5 w-3.5" />
                          <span>{goal.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Row 2: Feature Headers (sticky, light gray) ────────── */}
                  <div
                    className="sticky top-[37px] z-30 grid border-b border-border/70 bg-gray-50 dark:bg-neutral-800/80"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="border-r border-border/70 bg-gray-50 dark:bg-neutral-800/80 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sprints &amp; Actions
                    </div>
                    {goalColumns.map((goal) => {
                      const goalFeatures = features.filter(
                        (f) => f.goalId === goal.id
                      );
                      if (goalFeatures.length === 0) {
                        return (
                          <div
                            key={`empty-${goal.id}`}
                            className="border-r border-border/70 px-5 py-3 bg-gray-50 dark:bg-neutral-800/80"
                          />
                        );
                      }
                      return goalFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="border-r border-border/70 px-5 py-3 bg-gray-50 dark:bg-neutral-800/80"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-primary/80">
                            <Layers className="h-3.5 w-3.5 text-indigo-500/80" />
                            <span className="text-sm tracking-tight">
                              {feature.title}
                            </span>
                          </div>
                        </div>
                      ));
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

                      {goalColumns.map((goal) => {
                        const goalFeatures = features.filter(
                          (f) => f.goalId === goal.id
                        );
                        if (goalFeatures.length === 0) {
                          return (
                            <div
                              key={`empty-${goal.id}`}
                              className="border-r border-border/60 p-3 last:border-r-0 bg-card/10"
                            />
                          );
                        }
                        return goalFeatures.map((feature) => (
                          <div
                            key={feature.id}
                            className="border-r border-border/60 p-3 last:border-r-0 bg-card/10"
                          >
                            {renderCellContent(sprint.id, feature.id)}
                          </div>
                        ));
                      })}
                    </div>
                  ))}

                  {/* ── Backlog Row ─────────────────────────────────────────── */}
                  <div className="border-t-2 border-dashed border-border/60">
                    {/* Backlog section header */}
                    <div
                      className="grid border-b border-border/60 bg-amber-50/70 dark:bg-amber-950/20"
                      style={{ gridTemplateColumns: gridTemplateColumnsString }}
                    >
                      <div className="border-r border-border/70 px-5 py-2.5 flex items-center gap-2">
                        <Archive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
                          Backlog
                        </span>
                      </div>
                      {goalColumns.map((goal) => {
                        const goalFeatures = features.filter(
                          (f) => f.goalId === goal.id
                        );
                        if (goalFeatures.length === 0) {
                          return (
                            <div
                              key={`bl-empty-${goal.id}`}
                              className="border-r border-border/60 px-5 py-2.5 last:border-r-0"
                            />
                          );
                        }
                        return goalFeatures.map((feature) => (
                          <div
                            key={`bl-feat-${feature.id}`}
                            className="border-r border-border/60 px-5 py-2.5 last:border-r-0"
                          >
                            <span className="text-[11px] text-muted-foreground/70 italic">
                              {feature.title}
                            </span>
                          </div>
                        ));
                      })}
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

                      {goalColumns.map((goal) => {
                        const goalFeatures = features.filter(
                          (f) => f.goalId === goal.id
                        );
                        if (goalFeatures.length === 0) {
                          return (
                            <div
                              key={`bl-empty-cell-${goal.id}`}
                              className="border-r border-border/60 p-3 last:border-r-0"
                            />
                          );
                        }
                        return goalFeatures.map((feature) => (
                          <div
                            key={`bl-cell-${feature.id}`}
                            className="border-r border-border/60 p-3 last:border-r-0"
                          >
                            {renderCellContent(BACKLOG_SPRINT_ID, feature.id)}
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                >
                  {goals.map((g) => (
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
                disabled={!newFeatureTitle.trim() || !selectedGoalId}
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
                  value={selectedSprintId}
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
                  value={selectedFeatureId}
                  onChange={(e) => setSelectedFeatureId(e.target.value)}
                >
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
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
      </div>
    </div>
  );
}
