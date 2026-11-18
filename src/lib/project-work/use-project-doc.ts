"use client";

import * as React from "react";
import { canEdit } from "@/lib/product-board/storage";
import {
  isNewer,
  loadRemoteWork,
  readLocalWork,
  saveWork,
  type Stamped,
  writeLocalWork,
  type WorkKind,
} from "./storage";

const SAVE_DEBOUNCE_MS = 800;

export type ProjectDoc<T> = {
  value: T;
  /** Like a state setter; each change is saved after a short pause. */
  setValue: React.Dispatch<React.SetStateAction<T>>;
  /**
   * False until Supabase has answered for this project (or turned out to be
   * unavailable), so a page can show its skeleton instead of a copy that may
   * be about to change.
   */
  hydrated: boolean;
};

type Options<T> = {
  /** Null until the open project is known (it's read from this browser after mount). */
  projectId: string | null;
  kind: WorkKind;
  /** What a project starts with when nothing has been saved for it anywhere. */
  seed: (projectId: string) => T;
  /** Shown while no project is open. Must be a stable value. */
  empty: T;
  /** Where an older version of the app kept this document in localStorage. */
  legacyLocalKey?: (projectId: string) => string;
};

type Held<T> = { projectId: string | null; value: T; hydrated: boolean };

type Pending<T> = { projectId: string; stamped: Stamped<T> };

/**
 * One autosaved document of the open project (decisions, experiments, ...).
 *
 * Shows this browser's copy at once, then checks Supabase: if Supabase's copy
 * is newer it replaces what's shown; if this browser's is newer (a save that
 * never reached Supabase, or data from before Supabase was connected) it is
 * sent up. An edit made before Supabase answers wins over Supabase's copy.
 */
export function useProjectDoc<T>({ projectId, kind, seed, empty, legacyLocalKey }: Options<T>): ProjectDoc<T> {
  const [held, setHeld] = React.useState<Held<T>>({ projectId: null, value: empty, hydrated: false });
  if (held.projectId !== projectId) {
    const cached = projectId ? readLocalWork<T>(projectId, kind, legacyLocalKey?.(projectId)) : null;
    setHeld({
      projectId,
      value: projectId ? (cached ? cached.doc : seed(projectId)) : empty,
      hydrated: false,
    });
  }

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // The newest unsaved change. It carries its own project id, so a save that
  // lands after switching project still goes to the right one.
  const pending = React.useRef<Pending<T> | null>(null);
  const saving = React.useRef(false);
  // The project edited before Supabase answered, if any.
  const editedBeforeLoad = React.useRef<string | null>(null);

  const persist = React.useCallback(async () => {
    // One writer at a time; a change that lands mid-save is picked up by the loop.
    if (saving.current) return;
    saving.current = true;
    try {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        const result = await saveWork(next.projectId, kind, next.stamped);
        if (result.warning) console.warn(`[project-work] ${result.warning}`);
      }
    } finally {
      saving.current = false;
    }
  }, [kind]);

  const flush = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current) void persist();
  }, [persist]);

  const scheduleSave = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void persist();
    }, SAVE_DEBOUNCE_MS);
  }, [persist]);

  const setValue = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      setHeld((prev) => {
        if (!prev.projectId) return prev;
        const value = typeof action === "function" ? (action as (current: T) => T)(prev.value) : action;
        if (Object.is(value, prev.value)) return prev;
        pending.current = { projectId: prev.projectId, stamped: { doc: value, updatedAt: new Date().toISOString() } };
        if (!prev.hydrated) editedBeforeLoad.current = prev.projectId;
        return { ...prev, value };
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  // Reconcile with Supabase whenever the open project changes.
  React.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const cached = readLocalWork<T>(projectId, kind, legacyLocalKey?.(projectId));
      const remote = await loadRemoteWork<T>(projectId, kind);
      if (cancelled) return;

      const edited = editedBeforeLoad.current === projectId;
      editedBeforeLoad.current = null;
      let shown: T | undefined;

      if (remote.ok && !edited) {
        // A viewer's copy never wins: they can't save it, so Supabase's is the one shown.
        const localAhead =
          canEdit(projectId) && cached !== null && (remote.value === null || isNewer(cached, remote.value));
        if (localAhead) {
          if (!pending.current) {
            pending.current = { projectId, stamped: cached };
            void persist();
          }
        } else if (remote.value) {
          shown = remote.value.doc;
          // Keep this browser's copy current, for when Supabase is unreachable.
          writeLocalWork(projectId, kind, remote.value);
        }
      } else if (!remote.ok && remote.error) {
        console.warn(`[project-work] Couldn't load ${kind} from Supabase (${remote.error}). Using this browser's copy.`);
      }

      setHeld((prev) =>
        prev.projectId === projectId
          ? { ...prev, value: shown === undefined ? prev.value : shown, hydrated: true }
          : prev
      );
    })();

    return () => {
      cancelled = true;
      // Switching project: save the one being left.
      flush();
    };
    // `legacyLocalKey` is read once per project; it isn't expected to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, kind, persist, flush]);

  // Don't lose a pending change when the tab is hidden or closed.
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return { value: held.value, setValue, hydrated: held.hydrated };
}
