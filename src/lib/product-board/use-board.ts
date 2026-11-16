"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Backend } from "./storage";
import { isSupabaseConfigured, loadBoard, saveBoard } from "./storage";
import type { Block, Board, Section } from "./schema";
import { SEED_BOARD } from "./seed";

const SAVE_DEBOUNCE_MS = 800;

export type SaveState = "loading" | "idle" | "dirty" | "saving" | "saved" | "error";

export type BoardController = {
  board: Board | null;
  saveState: SaveState;
  backend: Backend;
  warning: string | null;
  /** Mutate the board immutably; schedules a debounced save. */
  mutate: (recipe: (draft: Board) => void) => void;
  /** Convenience: mutate a single block in place. */
  mutateBlock: (blockId: string, recipe: (block: Block) => void) => void;
  /** Force an immediate save (used on unmount / tab hide). */
  flush: () => void;
};

function findBlock(board: Board, blockId: string): Block | undefined {
  for (const section of board.sections) {
    for (const group of section.groups) {
      const hit = group.blocks.find((b) => b.id === blockId);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Loads and saves one project's board. `boardId` is null until the open
 * project is known (it's read from this browser after mount). The sample
 * project is seeded on first visit; any other id that can't be found falls
 * back to the sample, via `onMissing`.
 */
export function useBoard(boardId: string | null, onMissing?: () => void): BoardController {
  const [board, setBoard] = useState<Board | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [backend, setBackend] = useState<Backend>(
    isSupabaseConfigured() ? "supabase" : "local"
  );
  const [warning, setWarning] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always holds the newest board so a flush never writes a stale document.
  const latest = useRef<Board | null>(null);
  const saving = useRef(false);
  // Set when a mutation lands mid-save, so we re-save once the in-flight one lands.
  const resaveQueued = useRef(false);

  const persist = useCallback(async () => {
    // Coalesce: if a save is already in flight, just flag that another is needed
    // and let the running loop pick it up rather than starting a second writer.
    if (saving.current) {
      resaveQueued.current = true;
      return;
    }

    saving.current = true;
    try {
      do {
        resaveQueued.current = false;
        const next = latest.current;
        if (!next) break;

        setSaveState("saving");
        const result = await saveBoard(next);
        setBackend(result.backend);
        setWarning(result.warning ?? null);
        setSaveState(result.warning ? "error" : "saved");
      } while (resaveQueued.current);
    } finally {
      saving.current = false;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void persist();
    }, SAVE_DEBOUNCE_MS);
  }, [persist]);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      void persist();
    }
  }, [persist]);

  // Load whenever the open project changes. Seeds the sample on first ever visit.
  const onMissingRef = useRef(onMissing);
  useEffect(() => {
    onMissingRef.current = onMissing;
  }, [onMissing]);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;

    (async () => {
      const result = await loadBoard(boardId);
      if (cancelled) return;

      // A project this browser can't find (cleared storage, deleted row): the
      // caller switches to the sample, which re-runs this load.
      if (!result.board && boardId !== SEED_BOARD.id && onMissingRef.current) {
        onMissingRef.current();
        return;
      }

      const initial = result.board ?? SEED_BOARD;
      latest.current = initial;
      setBoard(initial);
      setBackend(result.backend);
      setWarning(result.warning ?? null);
      setSaveState("idle");

      // First visit: write the seed so the row exists and later loads are real.
      if (!result.board) {
        void persist();
      }
    })();

    return () => {
      cancelled = true;
      // Switching project: save the one being left before the next one loads.
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        void persist();
      }
    };
  }, [boardId, persist]);

  // Don't lose a pending debounce when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  const mutate = useCallback(
    (recipe: (draft: Board) => void) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const draft = structuredClone(prev);
        recipe(draft);
        draft.updatedAt = new Date().toISOString();
        latest.current = draft;
        return draft;
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  const mutateBlock = useCallback(
    (blockId: string, recipe: (block: Block) => void) => {
      mutate((draft) => {
        const block = findBlock(draft, blockId);
        if (block) {
          recipe(block);
          block.updatedAt = new Date().toISOString();
        }
      });
    },
    [mutate]
  );

  return { board, saveState, backend, warning, mutate, mutateBlock, flush };
}

/** Helper for section lookups in components. */
export function getSection(board: Board, sectionId: string): Section | undefined {
  return board.sections.find((s) => s.id === sectionId);
}
