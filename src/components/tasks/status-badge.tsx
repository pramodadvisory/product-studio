"use client";

import { ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  EXPERIMENT_STATUS_LABEL,
  HYPOTHESIS_STATUS_LABEL,
  STORY_STATUS_LABEL,
  type ExperimentStatus,
  type HypothesisStatus,
  type StoryStatus,
} from "@/app/(main)/design/experiments/tasks";

/**
 * Status pills for the three levels of the Tasks tree.
 *
 * Tone is carried by colour *and* by the label, never colour alone — the four
 * hypothesis states in particular have to stay distinguishable when the board is
 * skimmed in greyscale or by anyone who can't separate the amber from the green.
 */
const TONE = {
  neutral: "border-border bg-muted text-muted-foreground",
  amber:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
} as const;

type Tone = keyof typeof TONE;

export const HYPOTHESIS_TONE: Record<HypothesisStatus, Tone> = {
  unvalidated: "neutral",
  testing: "amber",
  validated: "emerald",
  invalidated: "rose",
};

export const EXPERIMENT_TONE: Record<ExperimentStatus, Tone> = {
  planned: "neutral",
  running: "sky",
  concluded: "emerald",
  abandoned: "rose",
};

export const STORY_TONE: Record<StoryStatus, Tone> = {
  todo: "neutral",
  "in-progress": "amber",
  done: "emerald",
  blocked: "rose",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(TONE[tone], className)}>
      {children}
    </Badge>
  );
}

/**
 * Pill that opens a menu of the statuses valid at its level. Generic over the
 * status union so each level keeps its own vocabulary — there is no shared
 * "status" type across hypotheses, experiments and stories on purpose.
 */
function StatusPicker<T extends string>({
  value,
  options,
  labels,
  tones,
  label,
  onChange,
  className,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  tones: Record<T, Tone>;
  label: string;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label} — currently ${labels[value]}`}
        render={
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center rounded-4xl outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              className
            )}
          />
        }
      >
        <StatusPill tone={tones[value]} className="gap-0.5 pr-1 hover:opacity-80">
          {labels[value]}
          <ChevronDownIcon className="size-3 opacity-60" />
        </StatusPill>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={cn(option === value && "font-medium")}
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full border",
                TONE[tones[option]]
              )}
            />
            {labels[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HypothesisStatusPicker(props: {
  value: HypothesisStatus;
  onChange: (next: HypothesisStatus) => void;
}) {
  return (
    <StatusPicker
      {...props}
      label="Hypothesis status"
      options={
        Object.keys(HYPOTHESIS_STATUS_LABEL) as HypothesisStatus[]
      }
      labels={HYPOTHESIS_STATUS_LABEL}
      tones={HYPOTHESIS_TONE}
    />
  );
}

export function ExperimentStatusPicker(props: {
  value: ExperimentStatus;
  onChange: (next: ExperimentStatus) => void;
}) {
  return (
    <StatusPicker
      {...props}
      label="Experiment status"
      options={Object.keys(EXPERIMENT_STATUS_LABEL) as ExperimentStatus[]}
      labels={EXPERIMENT_STATUS_LABEL}
      tones={EXPERIMENT_TONE}
    />
  );
}

export function StoryStatusPicker(props: {
  value: StoryStatus;
  onChange: (next: StoryStatus) => void;
}) {
  return (
    <StatusPicker
      {...props}
      label="Story status"
      options={Object.keys(STORY_STATUS_LABEL) as StoryStatus[]}
      labels={STORY_STATUS_LABEL}
      tones={STORY_TONE}
    />
  );
}
