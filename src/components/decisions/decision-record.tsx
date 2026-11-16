"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DECISION_SOURCE_LABEL,
  DECISION_STATUS_LABEL,
  type DecisionDraft,
  type DecisionImpact,
  type DecisionStatus,
} from "@/app/(main)/decisions/decisions";

/**
 * The presentation pieces a decision record is built from, shared by the
 * timeline and the draft the assistant proposes in the chat — a proposal should
 * look exactly like what it will become once saved.
 */

const STATUS_VARIANT: Record<
  DecisionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  decided: "default",
  proposed: "outline",
  revisited: "secondary",
  reversed: "destructive",
};

export function StatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {DECISION_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Impact reads as weight rather than colour, so it stays legible in both themes. */
const IMPACT_FILL: Record<DecisionImpact, string> = {
  high: "bg-foreground",
  medium: "bg-foreground/50",
  low: "bg-foreground/25",
};

export function ImpactMeter({ impact }: { impact: DecisionImpact }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn("size-2 shrink-0 rounded-full", IMPACT_FILL[impact])}
        aria-hidden
      />
      {impact} impact
    </span>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Prose({ children }: { children: string }) {
  return <p className="text-sm leading-relaxed text-foreground">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-2 text-sm leading-relaxed text-foreground"
        >
          <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Everything below the headline. Sections with nothing in them are dropped
 * rather than shown empty — a blank "Rationale" reads as a bug, and the
 * assistant deliberately leaves fields it couldn't support blank.
 */
export function DecisionBody({ record }: { record: DecisionDraft }) {
  const people = record.owner
    ? [record.owner, ...record.stakeholders]
    : record.stakeholders;

  return (
    <div className="space-y-4">
      <Section label="Context">
        <Prose>{record.context}</Prose>
      </Section>

      {record.rationale && (
        <Section label="Rationale">
          <Prose>{record.rationale}</Prose>
        </Section>
      )}

      {record.alternatives.length > 0 && (
        <Section label="Alternatives considered">
          <Bullets items={record.alternatives} />
        </Section>
      )}

      {record.consequences.length > 0 && (
        <Section label="What this commits us to">
          <Bullets items={record.consequences} />
        </Section>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
        {record.owner && (
          <span>
            Owner <span className="text-foreground">{record.owner}</span>
          </span>
        )}
        {record.stakeholders.length > 0 && (
          <span>
            With{" "}
            <span className="text-foreground">
              {record.stakeholders.join(", ")}
            </span>
          </span>
        )}
        {people.length === 0 && <span>No owner recorded</span>}
        <span>Source: {DECISION_SOURCE_LABEL[record.source]}</span>
        {record.confidence !== "high" && (
          <span>{record.confidence} confidence in this record</span>
        )}
      </div>
    </div>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="ghost" className="text-muted-foreground">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
