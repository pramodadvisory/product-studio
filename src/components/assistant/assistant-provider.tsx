"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import {
  useProjectBoard,
  useProjectDecisions,
  useProjectExperiments,
  useProjectProgress,
  useProjectStoryMap,
} from "@/components/project-data";
import { applyProposal, describeProposal, type AppliedChange } from "@/lib/assistant/apply";
import type { AssistantEvent, Proposal } from "@/lib/assistant/schema";
import { buildSnapshot } from "@/lib/assistant/snapshot";
import { getStage, locate, pagePath } from "@/lib/navigation";

/**
 * The assistant's state: whether the panel is open, where it was opened from,
 * the conversation, and each proposal's review status.
 *
 * Lives in the main layout so the conversation survives moving between pages
 * (the "View" link on an applied change takes you to it without losing the
 * chat). Proposals only change the project when the user applies them.
 */
export type ProposalStatus = "pending" | "applied" | "skipped";

export type ProposalEntry = {
  proposal: Proposal;
  status: ProposalStatus;
  applied?: AppliedChange;
  error?: string;
};

export type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  proposals: ProposalEntry[];
  error?: string;
  streaming?: boolean;
};

type OpenOptions = { scope?: string; draft?: string };

type AssistantContextValue = {
  isOpen: boolean;
  open: (options?: OpenOptions) => void;
  close: () => void;
  scope: string;
  draft: string;
  setDraft: (value: string) => void;
  turns: Turn[];
  sending: boolean;
  ready: boolean;
  send: (text: string) => Promise<void>;
  apply: (turnId: string, proposalId: string) => void;
  applyAll: (turnId: string) => void;
  skip: (turnId: string, proposalId: string) => void;
  restore: (turnId: string, proposalId: string) => void;
  undo: (turnId: string, proposalId: string) => void;
  startOver: () => void;
};

const AssistantContext = React.createContext<AssistantContextValue | null>(null);

export function useAssistant(): AssistantContextValue {
  const ctx = React.useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return ctx;
}

/** "Discover › Customers & pain points", "Decisions", "Overview"… */
function scopeFor(pathname: string): string {
  const { stage, page } = locate(pathname);
  if (stage) return pagePath(stage, page);
  if (pathname.startsWith("/decisions")) return "Library › Decisions";
  if (pathname.startsWith("/docs")) return "Library › Docs";
  return "Overview";
}

const newTurnId = () => `t-${Math.random().toString(36).slice(2, 10)}`;

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { board, mutateBlock } = useProjectBoard();
  const { decisions, saveDecision, deleteDecision } = useProjectDecisions();
  const { experiments, setExperiments } = useProjectExperiments();
  const { map, setMap, sprints } = useProjectStoryMap();
  const progress = useProjectProgress();

  const [isOpen, setIsOpen] = React.useState(false);
  const [openedScope, setOpenedScope] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [sending, setSending] = React.useState(false);

  const scope = openedScope ?? scopeFor(pathname);
  const ready = Boolean(board && progress);

  const open = React.useCallback((options?: OpenOptions) => {
    setOpenedScope(options?.scope ?? null);
    if (options?.draft) setDraft(options.draft);
    setIsOpen(true);
  }, []);
  const close = React.useCallback(() => setIsOpen(false), []);

  // ⌘J / Ctrl+J toggles the assistant from anywhere.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpenedScope(null);
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateTurn = React.useCallback((id: string, recipe: (turn: Turn) => Turn) => {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? recipe(turn) : turn)));
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending || !board || !progress) return;

      // Earlier turns go back as plain text, with a note of what was proposed
      // and what the user did with it, so the model knows what's settled.
      const history = turns
        .filter((turn) => turn.text || turn.proposals.length)
        .map((turn) => {
          if (turn.role === "user" || turn.proposals.length === 0) return { role: turn.role, text: turn.text || "…" };
          const notes = turn.proposals
            .map((entry) => `- ${entry.proposal.input.summary} (${entry.status})`)
            .join("\n");
          return { role: turn.role, text: `${turn.text}\n\n[Proposed updates]\n${notes}` };
        });

      const snapshot = buildSnapshot({
        board,
        decisions,
        experiments,
        storyMap: map,
        sprints,
        focusStage: getStage(progress.focus).name,
      });

      const userTurn: Turn = { id: newTurnId(), role: "user", text: message, proposals: [] };
      const replyId = newTurnId();
      setTurns((prev) => [...prev, userTurn, { id: replyId, role: "assistant", text: "", proposals: [], streaming: true }]);
      setDraft("");
      setSending(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, scope, history, snapshot }),
        });
        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error ?? `The assistant couldn't be reached (${response.status}).`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as AssistantEvent;
            if (event.type === "text") {
              updateTurn(replyId, (turn) => ({ ...turn, text: turn.text + event.text }));
            } else if (event.type === "proposal") {
              updateTurn(replyId, (turn) => ({
                ...turn,
                proposals: [...turn.proposals, { proposal: event.proposal, status: "pending" }],
              }));
            } else if (event.type === "error") {
              updateTurn(replyId, (turn) => ({ ...turn, error: event.message }));
            }
          }
        }
      } catch (error) {
        updateTurn(replyId, (turn) => ({
          ...turn,
          error: error instanceof Error ? error.message : "The assistant couldn't be reached.",
        }));
      } finally {
        updateTurn(replyId, (turn) => ({ ...turn, streaming: false }));
        setSending(false);
      }
    },
    [sending, board, progress, turns, decisions, experiments, map, sprints, scope, updateTurn]
  );

  const applyContext = { board, mutateBlock, saveDecision, deleteDecision, setExperiments, setMap };

  const setEntry = (turnId: string, proposalId: string, recipe: (entry: ProposalEntry) => ProposalEntry) =>
    updateTurn(turnId, (turn) => ({
      ...turn,
      proposals: turn.proposals.map((entry) => (entry.proposal.id === proposalId ? recipe(entry) : entry)),
    }));

  const findEntry = (turnId: string, proposalId: string) =>
    turns.find((t) => t.id === turnId)?.proposals.find((e) => e.proposal.id === proposalId);

  // Reverts with the change's own undo, so it works from a toast created
  // before React has re-rendered with the applied status.
  const revert = (turnId: string, proposalId: string, applied: AppliedChange) => {
    applied.undo();
    setEntry(turnId, proposalId, (e) => ({ ...e, status: "pending", applied: undefined }));
  };

  const undo = (turnId: string, proposalId: string) => {
    const entry = findEntry(turnId, proposalId);
    if (entry?.status === "applied" && entry.applied) revert(turnId, proposalId, entry.applied);
  };

  const applyOne = (turnId: string, entry: ProposalEntry): AppliedChange | null => {
    try {
      const applied = applyProposal(entry.proposal, applyContext);
      setEntry(turnId, entry.proposal.id, (e) => ({ ...e, status: "applied", applied, error: undefined }));
      return applied;
    } catch (error) {
      setEntry(turnId, entry.proposal.id, (e) => ({
        ...e,
        error: error instanceof Error ? error.message : "This change couldn't be applied.",
      }));
      return null;
    }
  };

  const apply = (turnId: string, proposalId: string) => {
    const entry = findEntry(turnId, proposalId);
    if (!entry || entry.status !== "pending") return;
    const applied = applyOne(turnId, entry);
    if (applied) {
      toast(`Applied: ${describeProposal(entry.proposal, board).kind}`, {
        action: { label: "Undo", onClick: () => revert(turnId, proposalId, applied) },
      });
    }
  };

  const applyAll = (turnId: string) => {
    const pending = turns.find((t) => t.id === turnId)?.proposals.filter((e) => e.status === "pending") ?? [];
    const done = pending
      .map((entry) => ({ id: entry.proposal.id, applied: applyOne(turnId, entry) }))
      .filter((item): item is { id: string; applied: AppliedChange } => item.applied !== null);
    if (done.length) {
      toast(`${done.length} ${done.length === 1 ? "update" : "updates"} applied`, {
        action: {
          label: "Undo",
          onClick: () => [...done].reverse().forEach((item) => revert(turnId, item.id, item.applied)),
        },
      });
    }
  };

  const value: AssistantContextValue = {
    isOpen,
    open,
    close,
    scope,
    draft,
    setDraft,
    turns,
    sending,
    ready,
    send,
    apply,
    applyAll,
    skip: (turnId, proposalId) => setEntry(turnId, proposalId, (e) => ({ ...e, status: "skipped" })),
    restore: (turnId, proposalId) => setEntry(turnId, proposalId, (e) => ({ ...e, status: "pending" })),
    undo,
    startOver: () => {
      if (!sending) setTurns([]);
    },
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
