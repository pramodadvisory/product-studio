"use client";

import * as React from "react";
import { CheckIcon, ClipboardPasteIcon, SendIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DecisionBody,
  ImpactMeter,
  StatusBadge,
  TagRow,
} from "@/components/decisions/decision-record";
import {
  extractDecision,
  type DecisionDraft,
} from "@/app/(main)/decisions/decisions";
import { SAMPLE_TRANSCRIPT } from "@/components/decisions/sample-transcript";

/**
 * The capture side of the Decisions page.
 *
 * The user drops in a transcript or just talks; the assistant answers with
 * either a drafted record or a question. A draft is never written to the
 * timeline on its own — the user accepts it, which keeps the log something they
 * curated rather than something that accumulated.
 *
 * The assistant itself is `extractDecision`, a pattern-matching stand-in. The
 * seam is deliberately narrow: swap that one call for a request to an API route
 * and everything below keeps working unchanged.
 */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Assistant turns only, and only when the material supported a record. */
  draft?: DecisionDraft;
  /** Set once the user accepts or dismisses the draft. */
  outcome?: "saved" | "dismissed";
};

const THINKING_MS = 650;

export function DecisionChat({
  onSave,
}: {
  onSave: (draft: DecisionDraft) => void;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  // Don't leave a pending reply to fire after the panel is gone.
  React.useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    // Captured before the state update so the extractor sees the conversation
    // as it stood when the user hit send.
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setThinking(true);

    timerRef.current = window.setTimeout(() => {
      const { reply, draft } = extractDecision(trimmed, history);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          ...(draft ? { draft } : {}),
        },
      ]);
      setThinking(false);
    }, THINKING_MS);
  }

  function resolveDraft(id: string, outcome: "saved" | "dismissed") {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, outcome } : m))
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a newline, which matters when pasting notes.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <SparklesIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Capture a decision</p>
          <p className="truncate text-xs text-muted-foreground">
            Paste a transcript, or talk it through
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4"
      >
        {messages.length === 0 && !thinking ? (
          <EmptyState onUseSample={() => setInput(SAMPLE_TRANSCRIPT)} />
        ) : (
          messages.map((message) =>
            message.role === "user" ? (
              <UserBubble key={message.id} content={message.content} />
            ) : (
              <React.Fragment key={message.id}>
                <AssistantBubble content={message.content} />
                {message.draft && (
                  <DraftProposal
                    draft={message.draft}
                    outcome={message.outcome}
                    onSave={() => {
                      onSave(message.draft!);
                      resolveDraft(message.id, "saved");
                    }}
                    onDismiss={() => resolveDraft(message.id, "dismissed")}
                  />
                )}
              </React.Fragment>
            )
          )
        )}

        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              Reading it through…
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a call transcript, or describe what was decided…"
            className="max-h-40 min-h-10 flex-1 resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || thinking}
            aria-label="Send"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onUseSample }: { onUseSample: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ClipboardPasteIcon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Turn a conversation into a record</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Drop in a call transcript or your notes and I&apos;ll pull out what was
          decided, why, and what it commits you to. If there&apos;s no decision
          in there, I&apos;ll ask.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onUseSample}>
        Try a sample transcript
      </Button>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap text-foreground">
        {content}
      </div>
    </div>
  );
}

/**
 * A proposed record, rendered the way it will appear on the timeline so there's
 * no surprise between accepting and seeing it saved.
 */
function DraftProposal({
  draft,
  outcome,
  onSave,
  onDismiss,
}: {
  draft: DecisionDraft;
  outcome?: "saved" | "dismissed";
  onSave: () => void;
  onDismiss: () => void;
}) {
  if (outcome === "dismissed") {
    return (
      <p className="px-1 text-xs text-muted-foreground italic">
        Draft discarded.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-xs",
        outcome === "saved" && "border-foreground/20"
      )}
    >
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={draft.status} />
          <ImpactMeter impact={draft.impact} />
        </div>
        <h3 className="text-sm font-semibold text-balance">{draft.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {draft.decision}
        </p>
        <TagRow tags={draft.tags} />
      </div>

      <div className="border-t px-3 py-3">
        <DecisionBody record={draft} />
      </div>

      <div className="flex items-center gap-2 border-t px-3 py-2">
        {outcome === "saved" ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckIcon className="size-3.5" />
            Saved to the timeline
          </p>
        ) : (
          <>
            <Button size="sm" onClick={onSave}>
              Save to timeline
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Discard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
