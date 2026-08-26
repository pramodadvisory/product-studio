"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Backend } from "./storage";
import { isSupabaseConfigured, loadBoard, saveBoard } from "./storage";
import type { Block, Board, Section } from "./schema";

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

export function useBoard(seed: Board): BoardController {
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

  // Initial load. Seeds the store on first ever visit.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await loadBoard(seed.id);
      if (cancelled) return;

      const initial = result.board ?? seed;
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
    };
    // `seed` is a module constant; intentionally load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
