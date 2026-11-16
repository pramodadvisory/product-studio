"use client";

import * as React from "react";
import { GavelIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useHeaderTitle } from "@/components/header-title-context";
import { PageColumn, PageHeader, SectionLabel } from "@/components/page-header";
import { useProjectDecisions } from "@/components/project-data";
import { useAssistant } from "@/components/assistant/assistant-provider";
import { DecisionTimeline } from "@/components/decisions/decision-timeline";
import {
  DECISION_STATUSES,
  DECISION_STATUS_LABEL,
  matchesQuery,
  type DecisionStatus,
} from "./decisions";

/**
 * Decisions — the decision log.
 *
 * Answers "what did we decide, and why?" months after everyone who was in the
 * room has forgotten. Decisions still waiting on a call sit at the top; the
 * log follows. Capture goes through the Studio assistant, which drafts the
 * record from a transcript or a description for you to review and apply.
 *
 * Records are held in localStorage (see `useDecisions`) and shared through
 * ProjectDataProvider, so the sidebar badge updates the moment you save.
 */
type Filter = "all" | DecisionStatus;

export default function DecisionsPage() {
  const { decisions, hydrated, deleteDecision } = useProjectDecisions();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const assistant = useAssistant();

  useHeaderTitle("Decisions");

  const byStatus = React.useMemo(() => {
    const counts = { proposed: 0, decided: 0, revisited: 0, reversed: 0 };
    for (const decision of decisions) counts[decision.status] += 1;
    return counts;
  }, [decisions]);

  const visible = React.useMemo(
    () =>
      decisions.filter(
        (decision) =>
          (filter === "all" || decision.status === filter) && matchesQuery(decision, query)
      ),
    [decisions, filter, query]
  );

  const waiting = visible.filter((d) => d.status === "proposed");
  const log = visible.filter((d) => d.status !== "proposed");
  const filtering = filter !== "all" || query.trim().length > 0;

  return (
    <PageColumn>
      <PageHeader
        eyebrow="Library"
        title="Decisions"
        description="What we decided, and why."
        action={
          <Button
            onClick={() =>
              assistant.open({
                scope: "Library › Decisions",
                draft: "Record a decision. Here's what was decided and why: ",
              })
            }
          >
            <PlusIcon />
            Record a decision
          </Button>
        }
        overflow={[
          {
            items: [
              { label: "Search decisions", icon: SearchIcon, onSelect: () => setSearching(true) },
            ],
          },
          {
            label: "Show",
            items: [
              { label: `All (${decisions.length})`, checked: filter === "all", onSelect: () => setFilter("all") },
              ...DECISION_STATUSES.map((status) => ({
                label: `${DECISION_STATUS_LABEL[status]} (${byStatus[status]})`,
                checked: filter === status,
                onSelect: () => setFilter(status),
              })),
            ],
          },
        ]}
      />

      {(searching || query) && (
        <div className="relative -mt-2">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setSearching(false)}
            placeholder="Search decisions"
            aria-label="Search decisions"
            className="pl-8"
          />
        </div>
      )}

      {filtering && (
        <p className="-mt-4 text-[13px] text-muted-foreground">
          Showing {visible.length} of {decisions.length}.{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              setFilter("all");
              setQuery("");
              setSearching(false);
            }}
          >
            Show everything
          </button>
        </p>
      )}

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GavelIcon />
            </EmptyMedia>
            <EmptyTitle>
              {!hydrated ? "Loading decisions" : filtering ? "Nothing matches" : "No decisions recorded yet"}
            </EmptyTitle>
            <EmptyDescription>
              {filtering
                ? "Clear the filter or search to see the whole log."
                : "Record a decision, or paste a call transcript into the assistant. It drafts the record for you to check."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {waiting.length > 0 && (
            <section>
              <SectionLabel>Waiting on you</SectionLabel>
              <DecisionTimeline decisions={waiting} onDelete={deleteDecision} />
            </section>
          )}
          {log.length > 0 && (
            <section>
              <SectionLabel>Decision log</SectionLabel>
              <DecisionTimeline decisions={log} onDelete={deleteDecision} />
            </section>
          )}
        </>
      )}

    </PageColumn>
  );
}
