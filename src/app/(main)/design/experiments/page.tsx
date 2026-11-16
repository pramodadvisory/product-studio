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
import { useHeaderTitle } from "@/components/header-title-context";
import { PageColumn, PageHeader, SectionLabel } from "@/components/page-header";
import { useProjectExperiments } from "@/components/project-data";
import { HypothesisCard } from "@/components/tasks/hypothesis-card";
import { getStage, stageEyebrow } from "@/lib/navigation";
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
} from "./tasks";

/**
 * Experiments — hypothesis-driven delivery.
 *
 * Hypothesis → Experiment → Story, as one nested accordion. Every mutation goes
 * through a pure transition in `tasks.ts`, so this component only holds the
 * board and the view state (which filter is active, which brand-new card should
 * open itself).
 *
 * State is held in ProjectDataProvider for the session (a refresh reseeds), so
 * the Overview and the Product Board see the same hypotheses. Wiring
 * persistence means saving the value each `setBoard` produces — no changes to
 * the handlers below.
 *
 * Arriving with `?open=<hypothesisId>` (the Product Board's "Test an
 * assumption" creates one and links here) opens that hypothesis.
 */
type Filter = "all" | HypothesisStatus;

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open: openId } = React.use(searchParams);
  const { experiments: board, setExperiments: setBoard } = useProjectExperiments();
  const [filter, setFilter] = React.useState<Filter>("all");
  // A hypothesis created from the header button is empty, so it opens itself —
  // otherwise the user is left looking at a blank row with nowhere obvious to type.
  const [autoOpenId, setAutoOpenId] = React.useState<string | null>(null);

  useHeaderTitle("Design › Experiments");

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
    <PageColumn>
      <PageHeader
        back={{ label: "Design", href: "/design" }}
        eyebrow={stageEyebrow(getStage("design"))}
        title="Experiments"
        description="What we're testing, and what we've learned."
        action={
          <Button onClick={handleAddHypothesis}>
            <PlusIcon />
            New hypothesis
          </Button>
        }
        overflow={[
          {
            label: "Show",
            items: [
              { label: `All (${board.length})`, checked: filter === "all", onSelect: () => setFilter("all") },
              ...HYPOTHESIS_STATUSES.map((status) => ({
                label: `${HYPOTHESIS_STATUS_LABEL[status]} (${byStatus[status]})`,
                checked: filter === status,
                onSelect: () => setFilter(status),
              })),
            ],
          },
        ]}
      />

      <section className="flex flex-col">
        <SectionLabel
          aside={
            filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Showing {HYPOTHESIS_STATUS_LABEL[filter].toLowerCase()} · show all
              </button>
            )
          }
        >
          Hypotheses
        </SectionLabel>
        <p className="mb-3 text-[13px] text-muted-foreground">
          <span className="tabular-nums">{counts.hypotheses}</span>{" "}
          {counts.hypotheses === 1 ? "hypothesis" : "hypotheses"} ·{" "}
          <span className="tabular-nums">{counts.experiments}</span>{" "}
          {counts.experiments === 1 ? "experiment" : "experiments"} (
          <span className="tabular-nums">{counts.running}</span> running) ·{" "}
          <span className="tabular-nums">{counts.stories}</span>{" "}
          {counts.stories === 1 ? "story" : "stories"}
        </p>

      {visible.length === 0 ? (
        <Empty className="border">
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
              defaultOpen={hypothesis.id === autoOpenId || hypothesis.id === openId}
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
      </section>
    </PageColumn>
  );
}
