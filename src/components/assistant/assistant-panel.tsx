"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, Loader2Icon, SendIcon, SparklesIcon } from "lucide-react";

import { useAssistant, type ProposalEntry, type Turn } from "@/components/assistant/assistant-provider";
import { useProjectBoard } from "@/components/project-data";
import { ConfidencePill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { describeProposal } from "@/lib/assistant/apply";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Paste notes from a customer call and I'll file what matters.",
  "What in Discover is still an assumption?",
  "We agreed to launch with three pricing tiers. Record that.",
];

/**
 * The assistant panel: one conversation, and a review card for every change
 * it proposes. Opened from the top bar (or ⌘J) and from capture buttons such
 * as Discover's "Add research findings". Nothing here writes until Apply.
 */
export function AssistantPanel() {
  const assistant = useAssistant();
  const { board } = useProjectBoard();
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const lastTurn = assistant.turns[assistant.turns.length - 1];
  const pendingInLast =
    lastTurn?.role === "assistant" && !lastTurn.streaming
      ? lastTurn.proposals.filter((p) => p.status === "pending").length
      : 0;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [assistant.turns]);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    void assistant.send(assistant.draft);
  };

  return (
    <Sheet open={assistant.isOpen} onOpenChange={(open) => (open ? assistant.open() : assistant.close())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b">
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4" />
              Studio assistant
            </SheetTitle>
            <SheetDescription className="truncate">Starting from: {assistant.scope}</SheetDescription>
          </div>
          {assistant.turns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mr-8 shrink-0"
              onClick={assistant.startOver}
              disabled={assistant.sending}
            >
              New chat
            </Button>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {assistant.turns.length === 0 ? (
            <EmptyState onPick={(text) => assistant.setDraft(text)} />
          ) : (
            assistant.turns.map((turn) =>
              turn.role === "user" ? (
                <UserBubble key={turn.id} text={turn.text} />
              ) : (
                <AssistantTurn key={turn.id} turn={turn} board={board} />
              )
            )
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2.5 border-t px-4 py-3">
          {pendingInLast > 1 && (
            <Button type="button" onClick={() => assistant.applyAll(lastTurn.id)}>
              Apply all ({pendingInLast})
            </Button>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              id="assistant-message"
              aria-label="Message the assistant"
              value={assistant.draft}
              onChange={(e) => assistant.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Tell Studio something, or paste notes…"
              rows={2}
              className="max-h-48 min-h-10 resize-none"
              disabled={!assistant.ready}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send"
              disabled={!assistant.ready || assistant.sending || !assistant.draft.trim()}
            >
              {assistant.sending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            </Button>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Changes are proposed for you to review. Nothing is saved until you apply it.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Tell me what you learned, decided or want to build. I&apos;ll propose where each piece goes, and
        you choose what to apply. You can also ask about the project.
      </p>
      <div className="flex flex-col divide-y rounded-lg border">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPick(example)}
            className="px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const long = text.length > 400;
  return (
    <div className="ml-8 self-end rounded-xl bg-muted px-3 py-2 text-sm">
      <p className={cn("whitespace-pre-wrap", long && !expanded && "line-clamp-6")}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-muted-foreground underline underline-offset-2"
        >
          {expanded ? "Show less" : "Show all"}
        </button>
      )}
    </div>
  );
}

function AssistantTurn({ turn, board }: { turn: Turn; board: ReturnType<typeof useProjectBoard>["board"] }) {
  const pending = turn.proposals.filter((p) => p.status === "pending").length;
  return (
    <div className="flex flex-col gap-3">
      {(turn.text || turn.streaming) && (
        <div className="mr-8 rounded-xl bg-muted/50 px-3 py-2 text-sm">
          {turn.text ? (
            <p className="whitespace-pre-wrap">{turn.text}</p>
          ) : (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" /> Reading…
            </span>
          )}
        </div>
      )}
      {turn.proposals.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              Proposed updates · {turn.proposals.length}
            </h3>
            {pending > 0 && <span className="text-xs text-muted-foreground">{pending} to review</span>}
          </div>
          {turn.proposals.map((entry) => (
            <ProposalCard key={entry.proposal.id} turnId={turn.id} entry={entry} board={board} />
          ))}
        </div>
      )}
      {turn.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {turn.error}
        </p>
      )}
    </div>
  );
}

function ProposalCard({
  turnId,
  entry,
  board,
}: {
  turnId: string;
  entry: ProposalEntry;
  board: ReturnType<typeof useProjectBoard>["board"];
}) {
  const assistant = useAssistant();
  const info = describeProposal(entry.proposal, board);
  const { summary, evidence } = entry.proposal.input;

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border p-3", entry.status !== "pending" && "bg-muted/40")}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowRightIcon className="size-3 shrink-0" />
        <span className="truncate">{info.where}</span>
      </p>

      {entry.status === "pending" ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm">
              <span className="font-semibold">{info.kind}:</span> {summary}
            </p>
            {info.confidence && <ConfidencePill confidence={info.confidence} />}
          </div>
          {info.effect && <p className="text-xs text-amber-700 dark:text-amber-400">{info.effect}</p>}
          <blockquote className="border-l-2 pl-2.5 text-[13px] text-muted-foreground">“{evidence}”</blockquote>
          {entry.error && <p className="text-xs text-destructive">{entry.error}</p>}
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={() => assistant.apply(turnId, entry.proposal.id)}>
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => assistant.skip(turnId, entry.proposal.id)}>
              Skip
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">
            {entry.status === "applied" ? "Applied" : "Skipped"} · {summary}
          </span>
          {entry.status === "applied" && entry.applied ? (
            <span className="flex shrink-0 items-center gap-3">
              <Link
                href={entry.applied.href}
                onClick={assistant.close}
                className="underline underline-offset-2 hover:text-foreground"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => assistant.undo(turnId, entry.proposal.id)}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Undo
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => assistant.restore(turnId, entry.proposal.id)}
              className="shrink-0 underline underline-offset-2"
            >
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}
