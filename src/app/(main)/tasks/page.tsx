"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  Flag,
  GripVertical,
  Layers,
  Plus,
  Target,
} from "lucide-react";

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
};

type StoriesByCell = Record<string, StoryItem[]>;

function cellKey(sprintId: string, featureId: string) {
  return `${sprintId}::${featureId}`;
}

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
    { id: "story-1", text: "As a PM, I can create a workspace in under 2 minutes" },
  ],
  [cellKey("sprint-1", "feature-2")]: [
    { id: "story-2", text: "As a new user, I can complete onboarding with contextual tips" },
  ],
  [cellKey("sprint-2", "feature-3")]: [
    { id: "story-3", text: "As a team, we can prioritize stories with drag and drop" },
  ],
  [cellKey("sprint-3", "feature-4")]: [
    { id: "story-4", text: "As a PM, I can see blocked stories due to dependencies" },
  ],
  [cellKey("sprint-4", "feature-5")]: [
    { id: "story-5", text: "As leadership, I can compare planned vs delivered scope" },
  ],
};

function SortableStoryCard({
  story,
  sprintId,
  featureId,
}: {
  story: StoryItem;
  sprintId: string;
  featureId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: story.id,
      data: {
        sprintId,
        featureId,
      },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-70" : "opacity-100"}
    >
      <div className="group relative flex items-start rounded-xl border border-muted-foreground/15 bg-card px-3 py-2.5 shadow-xs transition-all duration-200 hover:-translate-y-[1px] hover:border-emerald-500/30 hover:shadow-sm dark:bg-muted/10">
        <button
          type="button"
          aria-label="Reorder story"
          className="mr-2 inline-flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs leading-relaxed text-foreground/90">{story.text}</span>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [storiesByCell, setStoriesByCell] = useState<StoriesByCell>(initialStoriesByCell);

  const [activeModal, setActiveModal] = useState<"sprint" | "goal" | "feature" | "story" | null>(null);

  // Modal forms
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintWindow, setNewSprintWindow] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newStoryText, setNewStoryText] = useState("");

  const [selectedGoalId, setSelectedGoalId] = useState(initialGoals[0]?.id ?? "");
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprints[0]?.id ?? "");
  const [selectedFeatureId, setSelectedFeatureId] = useState(initialFeatures[0]?.id ?? "");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Dynamic Backbone layout styling helper: Goal Columns column-spanning index ranges
  const goalColumns = useMemo(() => {
    let currentIdx = 0;
    return goals.map((goal) => {
      const goalFeatures = features.filter((f) => f.goalId === goal.id);
      const colCount = Math.max(1, goalFeatures.length); // At least 1 column per goal
      const start = currentIdx + 2; // +1 for 1-based, +1 for sprint column
      const end = start + colCount;
      currentIdx += colCount;
      return {
        ...goal,
        colCount,
        start,
        end,
      };
    });
  }, [goals, features]);

  const goalFeatureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.id] = 0;
    }
    for (const feature of features) {
      counts[feature.goalId] = (counts[feature.goalId] ?? 0) + 1;
    }
    return counts;
  }, [goals, features]);

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
    if (!text || !text.trim()) return;
    const key = cellKey(sprintId, featureId);
    const story: StoryItem = {
      id: `story-${Date.now()}`,
      text: text.trim(),
    };
    setStoriesByCell((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), story],
    }));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { sprintId?: string; featureId?: string } | undefined;
    const overData = over.data.current as { sprintId?: string; featureId?: string } | undefined;

    if (
      !activeData?.sprintId ||
      !activeData.featureId ||
      activeData.sprintId !== overData?.sprintId ||
      activeData.featureId !== overData?.featureId
    ) {
      return;
    }

    const key = cellKey(activeData.sprintId, activeData.featureId);
    setStoriesByCell((prev) => {
      const laneItems = prev[key] ?? [];
      const oldIndex = laneItems.findIndex((item) => item.id === active.id);
      const newIndex = laneItems.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return {
        ...prev,
        [key]: arrayMove(laneItems, oldIndex, newIndex),
      };
    });
  };

  const totalGoalColumns = goalColumns.reduce((sum, g) => sum + g.colCount, 0);
  const gridTemplateColumnsString = `200px ${Array(totalGoalColumns).fill("minmax(240px, 1fr)").join(" ")}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold mb-1 tracking-tight">Tasks & Story Map</h1>
            <p className="text-sm text-muted-foreground">
              Define the user journey backbone with goals and features, and map user stories to implementation sprints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => {
              if (goals.length === 0 || features.length === 0) {
                alert("Please add at least one Goal and Feature first!");
                return;
              }
              setActiveModal("story");
}}>
              <Plus className="h-3.5 w-3.5" />
              Add Story
            </Button>
          </div>
        </div>

        {/* Story Mapping Board Matrix */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/10 shadow-xs">
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
                Drag stories to prioritize. Double click/click add button to append any story.
              </p>
            </div>

            <div className="border-b border-border/60 bg-background/60 px-5 py-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-sky-500" />
                Active Goals
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="shrink-0 rounded-lg border border-sky-200/70 bg-sky-50/60 px-3 py-2 dark:border-sky-900/50 dark:bg-sky-950/20"
                  >
                    <p className="text-xs font-medium leading-tight text-foreground">{goal.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {goalFeatureCounts[goal.id] ?? 0} feature{(goalFeatureCounts[goal.id] ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {features.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold">Storyboard is empty</h3>
                <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                  Get started by adding a user Goal, inserting your product Features, and mapping user Stories beneath them.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setActiveModal("goal")}>Add Goal</Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveModal("feature")}>Add Feature</Button>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <div className="min-w-[1220px]">
                  {/* Goal backbone Level 1 */}
                  <div
                    className="sticky top-0 z-40 grid border-b border-border/70 bg-muted/30 font-medium text-xs uppercase"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="border-r border-border/70 bg-background/95 px-5 py-2.5 font-bold tracking-wider text-muted-foreground shadow-xs">
                      The Backbone
                    </div>
                    {goalColumns.map((goal) => (
                      <div
                        key={goal.id}
                        className="border-r border-border/70 bg-background/95 px-5 py-2.5 shadow-xs"
                        style={{
                          gridColumn: `${goal.start} / ${goal.end}`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-300">
                          <Target className="h-3.5 w-3.5" />
                          <span>{goal.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feature level 2 Header Row */}
                  <div
                    className="sticky top-[37px] z-30 grid border-b border-border/70 bg-background/90"
                    style={{ gridTemplateColumns: gridTemplateColumnsString }}
                  >
                    <div className="border-r border-border/70 bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sprints & Actions
                    </div>
                    {goalColumns.map((goal) => {
                      const goalFeatures = features.filter((f) => f.goalId === goal.id);
                      if (goalFeatures.length === 0) {
                        return (
                          <div key={`empty-${goal.id}`} className="border-r border-border/70 px-5 py-3 bg-background" />
                        );
                      }
                      return goalFeatures.map((feature) => (
                        <div key={feature.id} className="border-r border-border/70 px-5 py-3 bg-background">
                          <div className="flex items-center gap-1.5 font-semibold text-primary/80">
                            <Layers className="h-3.5 w-3.5 text-indigo-500/80" />
                            <span className="text-sm tracking-tight">{feature.title}</span>
                          </div>
                        </div>
                      ));
                    })}
                  </div>

                  {/* Sprints Vertical Axis & Cells */}
                  {sprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="grid border-b border-border/60 last:border-b-0 hover:bg-muted/5 transition-colors duration-150"
                      style={{ gridTemplateColumns: gridTemplateColumnsString }}
                    >
                      {/* Vertical axis row-header */}
                      <div className="sticky left-0 z-20 border-r border-border/70 bg-background/95 px-5 py-5 flex flex-col justify-center backdrop-blur shadow-xs">
                        <p className="text-sm font-bold tracking-tight">{sprint.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{sprint.window}</p>
                      </div>

                      {/* Lane stories cells */}
                      {goalColumns.map((goal) => {
                        const goalFeatures = features.filter((f) => f.goalId === goal.id);
                        if (goalFeatures.length === 0) {
                          return (
                            <div key={`empty-${goal.id}`} className="border-r border-border/60 p-3 last:border-r-0 flex flex-col justify-between bg-card/10" />
                          );
                        }
                        return goalFeatures.map((feature) => {
                          const key = cellKey(sprint.id, feature.id);
                          const laneStories = storiesByCell[key] ?? [];

                          return (
                            <div key={feature.id} className="border-r border-border/60 p-3 last:border-r-0 flex flex-col justify-between bg-card/10">
                              <SortableContext
                                items={laneStories.map((story) => story.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {laneStories.map((story) => (
                                    <SortableStoryCard
                                      key={story.id}
                                      story={story}
                                      sprintId={sprint.id}
                                      featureId={feature.id}
                                    />
                                  ))}
                                </div>
                              </SortableContext>

                              <button
                                type="button"
                                className="group mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-background/40 py-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground hover:border-emerald-500/20 active:scale-[0.98] transition-all duration-150"
                                onClick={() => addStoryToCell(sprint.id, feature.id)}
                              >
                                <Plus className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-emerald-500" />
                                <span>Add Story</span>
                              </button>
                            </div>
                          );
                        });
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DndContext>

        {/* --- DIALOG MODALS --- */}
        {/* Add Sprint Modal */}
        <Dialog open={activeModal === "sprint"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sprint Row</DialogTitle>
              <DialogDescription>Create a vertical row to organize sprint delivery targets.</DialogDescription>
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
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button onClick={addSprint} disabled={!newSprintName.trim()}>Create Sprint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Goal Modal */}
        <Dialog open={activeModal === "goal"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Goal</DialogTitle>
              <DialogDescription>Goals organize features horizontally in your story map backbone.</DialogDescription>
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
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button onClick={addGoal} disabled={!newGoalTitle.trim()}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Feature Modal */}
        <Dialog open={activeModal === "feature"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product Feature</DialogTitle>
              <DialogDescription>Identify features underneath specific backbone goals.</DialogDescription>
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
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button onClick={addFeature} disabled={!newFeatureTitle.trim() || !selectedGoalId}>Create Feature</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Story Modal */}
        <Dialog open={activeModal === "story"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Story / Task</DialogTitle>
              <DialogDescription>Map concrete tasks to features and implementation runs.</DialogDescription>
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
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button onClick={addStory} disabled={!newStoryText.trim()}>Map Story</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
