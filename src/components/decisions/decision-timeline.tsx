"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ChevronRightIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DecisionBody,
  ImpactMeter,
  StatusBadge,
  TagRow,
} from "@/components/decisions/decision-record";
import { groupByMonth, type Decision } from "@/app/(main)/decisions/decisions";

/**
 * The decision log as a timeline.
 *
 * Records are grouped by the month they were decided in and read newest first.
 * Collapsed, an entry answers "what did we decide and does it still stand"; the
 * reasoning — why, what else was on the table, what it committed us to — is one
 * click away, because that's what someone reads when they're questioning a
 * decision months later rather than scanning for one.
 */
export function DecisionTimeline({
  decisions,
  onDelete,
}: {
  decisions: Decision[];
  onDelete: (id: string) => void;
}) {
  const groups = groupByMonth(decisions);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-1">
          <h2 className="pl-8 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </h2>
          <div>
            {group.decisions.map((decision, index) => (
              <TimelineEntry
                key={decision.id}
                decision={decision}
                isLast={index === group.decisions.length - 1}
                onDelete={() => onDelete(decision.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** A reversed decision still belongs on the timeline, but shouldn't read as live. */
function isSuperseded(decision: Decision): boolean {
  return decision.status === "reversed";
}

function TimelineEntry({
  decision,
  isLast,
  onDelete,
}: {
  decision: Decision;
  isLast: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const panelId = `decision-${decision.id}`;

  return (
    <div className="relative pl-8">
      {/* The rail: a continuous line through the month, stopping at the last entry. */}
      {!isLast && (
        <span
          className="absolute top-3 bottom-0 left-[5px] w-px bg-border"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "absolute top-3 left-0 size-[11px] rounded-full border-2 border-background",
          isSuperseded(decision) ? "bg-muted-foreground/40" : "bg-foreground"
        )}
        aria-hidden
      />

      <div className="pb-4">
        <div
          className={cn(
            "rounded-xl border bg-card shadow-xs transition-colors",
            isSuperseded(decision) && "bg-muted/40"
          )}
        >
          <div className="flex items-start gap-2 p-3">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? "Hide reasoning" : "Show reasoning"}
              className="mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground transition hover:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <ChevronRightIcon
                className={cn("size-4 transition-transform", open && "rotate-90")}
              />
            </button>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <time
                  dateTime={decision.decidedOn}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {format(parseISO(decision.decidedOn), "d MMM")}
                </time>
                <StatusBadge status={decision.status} />
                <ImpactMeter impact={decision.impact} />
              </div>

              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="block w-full text-left"
              >
                <h3
                  className={cn(
                    "text-sm font-semibold text-balance",
                    isSuperseded(decision) && "line-through decoration-1"
                  )}
                >
                  {decision.title}
                </h3>
              </button>

              <p
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground",
                  !open && "line-clamp-2"
                )}
              >
                {decision.decision}
              </p>

              <TagRow tags={decision.tags} />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              aria-label={`Delete decision: ${decision.title}`}
              onClick={onDelete}
            >
              <Trash2Icon />
            </Button>
          </div>

          {open && (
            <div id={panelId} className="border-t px-3 py-3 pl-9">
              <DecisionBody record={decision} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
