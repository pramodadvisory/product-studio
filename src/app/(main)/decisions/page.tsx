"use client";

import * as React from "react";
import { GavelIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { HeaderActions, useHeaderTitle } from "@/components/header-title-context";
import { DecisionChat } from "@/components/decisions/decision-chat";
import { DecisionTimeline } from "@/components/decisions/decision-timeline";
import { useDecisions } from "@/hooks/use-decisions";
import {
  DECISION_STATUSES,
  DECISION_STATUS_LABEL,
  matchesQuery,
  type DecisionStatus,
} from "./decisions";

/**
 * Decisions — the decision log.
 *
 * Two halves that feed each other: capture on the right, where a transcript or
 * a conversation becomes a record, and the timeline on the left, which is what
 * the log is actually for — being able to answer "why did we do this" months
 * after everyone who was in the room has forgotten.
 *
 * Records are held in localStorage (see `useDecisions`), so the log survives a
 * refresh on the machine that captured it.
 */
type Filter = "all" | DecisionStatus;

export default function DecisionsPage() {
  const { decisions, hydrated, saveDecision, deleteDecision } = useDecisions();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

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
          (filter === "all" || decision.status === filter) &&
          matchesQuery(decision, query)
      ),
    [decisions, filter, query]
  );

  const filtering = filter !== "all" || query.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <HeaderActions>
        <p className="hidden text-sm text-muted-foreground sm:block">
          <span className="tabular-nums">{decisions.length}</span>{" "}
          {decisions.length === 1 ? "decision" : "decisions"} recorded
        </p>
      </HeaderActions>

      {/* Left — the log */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as Filter)}
          >
            <TabsList>
              <TabsTrigger value="all">
                All
                <Count>{decisions.length}</Count>
              </TabsTrigger>
              {DECISION_STATUSES.map((status) => (
                <TabsTrigger key={status} value={status}>
                  {DECISION_STATUS_LABEL[status]}
                  <Count>{byStatus[status]}</Count>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-56">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search decisions"
              aria-label="Search decisions"
              className="pl-8"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 lg:px-6">
          {visible.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GavelIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {!hydrated
                    ? "Loading decisions"
                    : filtering
                      ? "Nothing matches"
                      : "No decisions recorded yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {filtering
                    ? "Clear the filter or search to see the whole log."
                    : "Paste a call transcript into the assistant and it will draft the first record for you."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DecisionTimeline decisions={visible} onDelete={deleteDecision} />
          )}
        </div>
      </main>

      {/* Right — capture. Drops below the log on narrow screens rather than
          disappearing, since it's half the point of the page. */}
      <aside className="h-[60vh] shrink-0 border-t lg:h-auto lg:w-96 lg:border-t-0 lg:border-l">
        <DecisionChat onSave={saveDecision} />
      </aside>
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
