"use client";

import * as React from "react";
import { ChevronRightIcon, FlaskConicalIcon } from "lucide-react";

import {
  AddButton,
  EditableLine,
  EditableText,
  RemoveButton,
} from "@/components/product-board/editable";
import { StoryRow } from "@/components/tasks/story-row";
import { ExperimentStatusPicker } from "@/components/tasks/status-badge";
import { cn } from "@/lib/utils";
import {
  experimentProgress,
  formatWindow,
  type Experiment,
  type StoryItem,
} from "@/app/(main)/design/experiments/tasks";

/**
 * The middle level of the tree: the test that settles a hypothesis.
 *
 * Collapsed, it has to answer "is this running, and how far along is the work?"
 * without being opened — hence the metric, window and story count all sitting on
 * the header row.
 */
export function ExperimentCard({
  experiment,
  onChange,
  onDelete,
  onAddStory,
  onChangeStory,
  onDeleteStory,
}: {
  experiment: Experiment;
  onChange: (patch: Partial<Omit<Experiment, "id" | "stories">>) => void;
  onDelete: () => void;
  onAddStory: () => void;
  onChangeStory: (
    storyId: string,
    patch: Partial<Omit<StoryItem, "id">>
  ) => void;
  onDeleteStory: (storyId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const progress = experimentProgress(experiment);
  const window = formatWindow(experiment.startDate, experiment.endDate);
  const concluded =
    experiment.status === "concluded" || experiment.status === "abandoned";

  return (
    <div className="group/row rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Collapse experiment" : "Expand experiment"}
          className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronRightIcon
            className={cn("size-4 transition-transform", open && "rotate-90")}
          />
        </button>

        <FlaskConicalIcon className="size-3.5 shrink-0 text-muted-foreground/60" />

        <EditableLine
          value={experiment.title}
          onCommit={(title) => onChange({ title })}
          label="Experiment title"
          placeholder="Name the experiment…"
          className="text-sm font-medium"
        />

        {window && (
          <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums lg:inline">
            {window}
          </span>
        )}

        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {progress.doneCount}/{progress.storyCount}
        </span>

        <ExperimentStatusPicker
          value={experiment.status}
          onChange={(status) => onChange({ status })}
        />

        <RemoveButton onClick={onDelete} label="Delete experiment" />
      </div>

      {open && (
        <div className="animate-in fade-in duration-150 space-y-3 border-t px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Success metric">
              <EditableLine
                value={experiment.metric}
                onCommit={(metric) => onChange({ metric })}
                label="Success metric"
                placeholder="What moves if this works?"
              />
            </Field>
            <Field label="Target">
              <EditableLine
                value={experiment.target}
                onCommit={(target) => onChange({ target })}
                label="Target"
                placeholder="The threshold that counts as a win"
              />
            </Field>
            <Field label="Starts">
              <DateInput
                value={experiment.startDate}
                onChange={(startDate) => onChange({ startDate })}
                label="Start date"
              />
            </Field>
            <Field label="Ends">
              <DateInput
                value={experiment.endDate}
                onChange={(endDate) => onChange({ endDate })}
                label="End date"
              />
            </Field>
          </div>

          {/* Learnings stay visible while an experiment is still open so notes
              can accumulate before the read-out, but only the concluded states
              highlight the field as the thing to fill in. */}
          <Field label={concluded ? "Result & learnings" : "Notes so far"}>
            <EditableText
              value={experiment.result}
              onCommit={(result) => onChange({ result })}
              label="Result"
              placeholder={
                concluded
                  ? "What did we learn, and what changes because of it?"
                  : "Early signal, caveats, anything worth remembering…"
              }
              className={cn(
                "text-sm",
                concluded && "text-foreground",
                !concluded && "text-muted-foreground"
              )}
            />
          </Field>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Stories
              </span>
              {progress.points > 0 && (
                <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                  {progress.donePoints}/{progress.points} pts
                </span>
              )}
            </div>

            {experiment.stories.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground/70">
                No stories yet — add the work this experiment needs to run.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {experiment.stories.map((story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    onChange={(patch) => onChangeStory(story.id, patch)}
                    onDelete={() => onDeleteStory(story.id)}
                  />
                ))}
              </div>
            )}

            <AddButton onClick={onAddStory} className="mt-1">
              Add story
            </AddButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Native date control, styled down to match the inline-editing fields around it
 * rather than looking like a form input dropped into the card.
 */
function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-sm border-0 bg-transparent p-0 text-sm outline-none transition-colors hover:bg-foreground/[0.04] focus:bg-foreground/[0.06] focus:ring-1 focus:ring-ring/40"
    />
  );
}
