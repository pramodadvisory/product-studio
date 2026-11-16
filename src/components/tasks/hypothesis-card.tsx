"use client";

import * as React from "react";
import { ChevronRightIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddButton, EditableText } from "@/components/product-board/editable";
import { ExperimentCard } from "@/components/tasks/experiment-card";
import { HypothesisStatusPicker } from "@/components/tasks/status-badge";
import { cn } from "@/lib/utils";
import {
  hypothesisDeleteImpact,
  hypothesisProgress,
  type Experiment,
  type Hypothesis,
  type StoryItem,
} from "@/app/(main)/design/experiments/tasks";

/**
 * Top level of the tree. Collapsed it reads as a claim plus how much evidence
 * has been gathered against it; expanded it exposes the belief statement and
 * the experiments testing it.
 *
 * Deleting cascades through experiments and stories, so anything with children
 * behind it asks first — the count in the prompt is the whole blast radius.
 */
export function HypothesisCard({
  hypothesis,
  defaultOpen = false,
  onChange,
  onDelete,
  onAddExperiment,
  onChangeExperiment,
  onDeleteExperiment,
  onAddStory,
  onChangeStory,
  onDeleteStory,
}: {
  hypothesis: Hypothesis;
  defaultOpen?: boolean;
  onChange: (patch: Partial<Omit<Hypothesis, "id" | "experiments">>) => void;
  onDelete: () => void;
  onAddExperiment: () => void;
  onChangeExperiment: (
    experimentId: string,
    patch: Partial<Omit<Experiment, "id" | "stories">>
  ) => void;
  onDeleteExperiment: (experimentId: string) => void;
  onAddStory: (experimentId: string) => void;
  onChangeStory: (
    experimentId: string,
    storyId: string,
    patch: Partial<Omit<StoryItem, "id">>
  ) => void;
  onDeleteStory: (experimentId: string, storyId: string) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const progress = hypothesisProgress(hypothesis);
  const impact = hypothesisDeleteImpact(hypothesis);

  function requestDelete() {
    if (impact.experimentCount === 0 && impact.storyCount === 0) {
      onDelete();
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Collapse hypothesis" : "Expand hypothesis"}
          className="mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronRightIcon
            className={cn("size-4 transition-transform", open && "rotate-90")}
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <EditableText
            value={hypothesis.title}
            onCommit={(title) => onChange({ title })}
            label="Hypothesis"
            placeholder="State the hypothesis…"
            className="text-base font-medium"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {hypothesis.experiments.length}{" "}
              {hypothesis.experiments.length === 1
                ? "experiment"
                : "experiments"}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {progress.doneCount}/{progress.storyCount} stories done
            </span>
            <ProgressBar percent={progress.percent} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ConfidenceReadout value={hypothesis.confidence} />
          <HypothesisStatusPicker
            value={hypothesis.status}
            onChange={(status) => onChange({ status })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete hypothesis"
            onClick={requestDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="animate-in fade-in duration-150 space-y-4 border-t px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Statement label="We believe that">
              <EditableText
                value={hypothesis.belief}
                onCommit={(belief) => onChange({ belief })}
                label="Belief"
                placeholder="…the claim we're putting at risk, and why we think it holds."
              />
            </Statement>
            <Statement label="We'll know we're right when">
              <EditableText
                value={hypothesis.signal}
                onCommit={(signal) => onChange({ signal })}
                label="Signal"
                placeholder="…the evidence that would settle this, stated as a number."
              />
            </Statement>
          </div>

          <ConfidenceSlider
            value={hypothesis.confidence}
            onChange={(confidence) => onChange({ confidence })}
          />

          <div className="space-y-2">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Experiments
            </span>

            {hypothesis.experiments.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                No experiments yet — add the test that would settle this.
              </p>
            ) : (
              <div className="space-y-2">
                {hypothesis.experiments.map((experiment) => (
                  <ExperimentCard
                    key={experiment.id}
                    experiment={experiment}
                    onChange={(patch) => onChangeExperiment(experiment.id, patch)}
                    onDelete={() => onDeleteExperiment(experiment.id)}
                    onAddStory={() => onAddStory(experiment.id)}
                    onChangeStory={(storyId, patch) =>
                      onChangeStory(experiment.id, storyId, patch)
                    }
                    onDeleteStory={(storyId) =>
                      onDeleteStory(experiment.id, storyId)
                    }
                  />
                ))}
              </div>
            )}

            <AddButton onClick={onAddExperiment}>Add experiment</AddButton>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this hypothesis?</DialogTitle>
            <DialogDescription>
              {hypothesis.title || "This hypothesis"} will be removed along with{" "}
              {impact.experimentCount}{" "}
              {impact.experimentCount === 1 ? "experiment" : "experiments"} and{" "}
              {impact.storyCount}{" "}
              {impact.storyCount === 1 ? "story" : "stories"}. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Statement({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <span
      className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${percent}% of stories done`}
    >
      <span
        className="block h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

/** Compact confidence figure for the collapsed header. */
function ConfidenceReadout({ value }: { value: number }) {
  return (
    <span
      title={`${value}% confidence`}
      className="hidden text-xs text-muted-foreground tabular-nums sm:inline"
    >
      {value}% confident
    </span>
  );
}

function ConfidenceSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
      >
        Confidence
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
      <span className="text-xs text-muted-foreground tabular-nums">
        {value}%
      </span>
    </div>
  );
}
