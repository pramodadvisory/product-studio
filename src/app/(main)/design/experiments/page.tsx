"use client";

import * as React from "react";
import { LightbulbIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions, useHeaderTitle } from "@/components/header-title-context";
import { HypothesisCard } from "@/components/tasks/hypothesis-card";
import { SEED_BOARD } from "./seed-data";
import {
  HYPOTHESIS_STATUS_LABEL,
  HYPOTHESIS_STATUSES,
  addExperiment,
  addHypothesis,
  addStory,
  boardCounts,
  countByStatus,
  createExperiment,
  createHypothesis,
  createStory,
  deleteExperiment,
  deleteHypothesis,
  deleteStory,
  updateExperiment,
  updateHypothesis,
  updateStory,
  type HypothesisStatus,
  type TaskBoard,
} from "./tasks";

/**
 * Tasks — hypothesis-driven delivery.
 *
 * Hypothesis → Experiment → Story, as one nested accordion. Every mutation goes
 * through a pure transition in `tasks.ts`, so this component only holds the
 * board and the view state (which filter is active, which brand-new card should
 * open itself).
 *
 * State is in memory only: a refresh reseeds. Wiring persistence means saving
 * the value each `setBoard` produces — no changes to the handlers below.
 */
type Filter = "all" | HypothesisStatus;

export default function TasksPage() {
  const [board, setBoard] = React.useState<TaskBoard>(SEED_BOARD);
  const [filter, setFilter] = React.useState<Filter>("all");
  // A hypothesis created from the header button is empty, so it opens itself —
  // otherwise the user is left looking at a blank row with nowhere obvious to type.
  const [autoOpenId, setAutoOpenId] = React.useState<string | null>(null);

  useHeaderTitle("Tasks");

  const counts = boardCounts(board);
  const byStatus = countByStatus(board);
  const visible =
    filter === "all"
      ? board
      : board.filter((hypothesis) => hypothesis.status === filter);

  function handleAddHypothesis() {
    const hypothesis = createHypothesis();
    setBoard((prev) => addHypothesis(prev, hypothesis));
    setAutoOpenId(hypothesis.id);
    // A new hypothesis is Unvalidated; leaving a narrower filter on would hide
    // the card the user just asked for.
    setFilter("all");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 lg:px-6">
      <HeaderActions>
        <Button onClick={handleAddHypothesis}>
          <PlusIcon />
          New hypothesis
        </Button>
      </HeaderActions>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{counts.hypotheses}</span>{" "}
          {counts.hypotheses === 1 ? "hypothesis" : "hypotheses"} ·{" "}
          <span className="tabular-nums">{counts.experiments}</span>{" "}
          {counts.experiments === 1 ? "experiment" : "experiments"} (
          <span className="tabular-nums">{counts.running}</span> running) ·{" "}
          <span className="tabular-nums">{counts.stories}</span>{" "}
          {counts.stories === 1 ? "story" : "stories"}
        </p>

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList>
            <TabsTrigger value="all">
              All
              <Count>{board.length}</Count>
            </TabsTrigger>
            {HYPOTHESIS_STATUSES.map((status) => (
              <TabsTrigger key={status} value={status}>
                {HYPOTHESIS_STATUS_LABEL[status]}
                <Count>{byStatus[status]}</Count>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {visible.length === 0 ? (
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LightbulbIcon />
            </EmptyMedia>
            <EmptyTitle>
              {board.length === 0
                ? "No hypotheses yet"
                : `Nothing ${HYPOTHESIS_STATUS_LABEL[
                    filter as HypothesisStatus
                  ].toLowerCase()}`}
            </EmptyTitle>
            <EmptyDescription>
              {board.length === 0
                ? "Start with a belief worth testing, then add the experiments that would settle it."
                : "Every hypothesis on the board is in another state right now."}
            </EmptyDescription>
          </EmptyHeader>
          {board.length === 0 && (
            <EmptyContent>
              <Button onClick={handleAddHypothesis}>
                <PlusIcon />
                New hypothesis
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="space-y-3">
          {visible.map((hypothesis) => (
            <HypothesisCard
              key={hypothesis.id}
              hypothesis={hypothesis}
              defaultOpen={hypothesis.id === autoOpenId}
              onChange={(patch) =>
                setBoard((prev) => updateHypothesis(prev, hypothesis.id, patch))
              }
              onDelete={() =>
                setBoard((prev) => deleteHypothesis(prev, hypothesis.id))
              }
              onAddExperiment={() =>
                setBoard((prev) =>
                  addExperiment(prev, hypothesis.id, createExperiment())
                )
              }
              onChangeExperiment={(experimentId, patch) =>
                setBoard((prev) =>
                  updateExperiment(prev, hypothesis.id, experimentId, patch)
                )
              }
              onDeleteExperiment={(experimentId) =>
                setBoard((prev) =>
                  deleteExperiment(prev, hypothesis.id, experimentId)
                )
              }
              onAddStory={(experimentId) =>
                setBoard((prev) =>
                  addStory(prev, hypothesis.id, experimentId, createStory(prev))
                )
              }
              onChangeStory={(experimentId, storyId, patch) =>
                setBoard((prev) =>
                  updateStory(prev, hypothesis.id, experimentId, storyId, patch)
                )
              }
              onDeleteStory={(experimentId, storyId) =>
                setBoard((prev) =>
                  deleteStory(prev, hypothesis.id, experimentId, storyId)
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
      {children}
    </span>
  );
}
