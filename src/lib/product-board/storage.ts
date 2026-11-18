import type { SupabaseClient } from "@supabase/supabase-js";
import { adoptLocalData } from "@/lib/auth/local-data";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { migrateBoard } from "./migrate";
import { isBoardCompatible, type Board } from "./schema";
import { SEED_BOARD } from "./seed";

/**
 * Persistence for the product board.
 *
 * The board is one JSON document, so a save is a single upsert. Supabase is used
 * when it is configured; otherwise we fall back to localStorage so edits are
 * never silently lost on a machine without env vars. `backend` is surfaced in
 * the UI so the distinction is always visible to the user.
 *
 * The client is the signed-in browser client (`@/lib/supabase/client`), so
 * every read and write is made as the signed-in person and the database's
 * access rules decide what they can reach. A missing env var still falls back
 * to localStorage instead of breaking the page.
 *
 * Two kinds of project never reach Supabase from here:
 * - the sample project: it has the same id for everyone, so each person's
 *   copy stays in their own browser;
 * - a project the signed-in person can only view: their edits stay on screen
 *   and are not saved anywhere.
 *
 * A copy that has been in Supabase and is now missing there (the project was
 * deleted, or this person was removed or left) is dropped, not sent up again.
 */
export type Backend = "supabase" | "local";

export type ProjectRole = "owner" | "editor" | "viewer";

export const BOARDS_TABLE = "product_boards";
const LOCAL_KEY_PREFIX = "product-board:";

export const VIEW_ONLY_WARNING = "You can view this project but not edit it, so changes aren't saved.";

let clientCache: SupabaseClient | null | undefined;

/** Returns null (rather than throwing) when Supabase isn't configured, and on the server. */
function getClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (clientCache !== undefined) return clientCache;
  clientCache = createClient();
  return clientCache;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/** The shared client, or null when Supabase isn't configured. Used by publishing. */
export function getSupabaseClient(): SupabaseClient | null {
  return getClient();
}

/** True for the sample project, which is kept only in this browser. */
export function isLocalOnly(boardId: string): boolean {
  return boardId === SEED_BOARD.id;
}

// The signed-in person's role on each project they have loaded or listed.
const roles = new Map<string, ProjectRole>();

// Projects deleted or left in this tab. Nothing is saved for them, so a save
// still in flight can't bring them back.
const gone = new Set<string>();

/** Null when unknown: not loaded yet, not saved yet, or Supabase is off. */
export function getProjectRole(boardId: string): ProjectRole | null {
  return roles.get(boardId) ?? null;
}

/** False when the signed-in person is known to be a viewer, or has deleted or left the project. */
export function canEdit(boardId: string): boolean {
  return !gone.has(boardId) && roles.get(boardId) !== "viewer";
}

let sessionChecked: Promise<void> | null = null;

/**
 * Before any local copy is read for syncing: if this browser's copies were
 * saved by someone else, clear them (see `@/lib/auth/local-data`). Runs once
 * per page load; the session is read from the cookie, not the network.
 */
export function ensureLocalDataOwner(): Promise<void> {
  const client = getClient();
  if (!client) return Promise.resolve();
  sessionChecked ??= client.auth.getSession().then(({ data }) => {
    if (data.session) adoptLocalData(data.session.user.id);
  });
  return sessionChecked;
}

async function loadRoles(client: SupabaseClient) {
  const { data, error } = await client.rpc("my_project_roles");
  if (error) return;
  for (const row of (data ?? []) as { board_id: string; role: ProjectRole }[]) {
    roles.set(row.board_id, row.role);
    // Added back since leaving.
    gone.delete(row.board_id);
  }
}

async function loadRole(client: SupabaseClient, boardId: string): Promise<ProjectRole | null> {
  const { data, error } = await client.rpc("project_role", { p_board_id: boardId });
  if (error) return roles.get(boardId) ?? null;
  const role = (data as ProjectRole | null) ?? null;
  if (role) {
    roles.set(boardId, role);
    gone.delete(boardId);
  } else roles.delete(boardId);
  return role;
}

function localKey(boardId: string) {
  return `${LOCAL_KEY_PREFIX}${boardId}`;
}

// Set once a project has been seen in Supabase, so this browser can tell a
// copy Supabase never got (send it up) from one it has lost (drop it).
function syncedKey(boardId: string) {
  return `product-studio:synced:${boardId}`;
}

function markSynced(boardId: string) {
  try {
    window.localStorage.setItem(syncedKey(boardId), "1");
  } catch {
    // Storage blocked: there's no local copy to drop later either.
  }
}

function wasSynced(boardId: string): boolean {
  try {
    return window.localStorage.getItem(syncedKey(boardId)) === "1";
  } catch {
    return false;
  }
}

/**
 * Drops this browser's copy of a project and stops saving it, after it has
 * been deleted or left. Its work is dropped by `forgetWork` (project-work).
 */
export function forgetBoard(boardId: string) {
  gone.add(boardId);
  roles.delete(boardId);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(localKey(boardId));
    window.localStorage.removeItem(syncedKey(boardId));
  } catch {
    // Storage blocked: nothing was kept.
  }
}

/**
 * Discards anything that isn't the current schema. Without this, a board saved
 * by an earlier version keeps loading and crashes the renderer — and since it's
 * in the user's own browser, they can't get past it without clearing storage.
 */
function accept(value: unknown, source: string): Board | null {
  if (value == null) return null;
  if (isBoardCompatible(value)) return value;
  const migrated = migrateBoard(value);
  if (migrated) return migrated;
  console.info(
    `[product-board] Discarding incompatible stored board from ${source}; reseeding.`
  );
  return null;
}

function readLocal(boardId: string): Board | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localKey(boardId));
    return raw ? accept(JSON.parse(raw), "localStorage") : null;
  } catch {
    return null;
  }
}

function writeLocal(board: Board) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localKey(board.id), JSON.stringify(board));
  } catch {
    // Quota or private-mode failure — the caller reports this as an error state.
  }
}

function listLocal(): Board[] {
  if (typeof window === "undefined") return [];
  const boards: Board[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(LOCAL_KEY_PREFIX)) continue;
      const board = readLocal(key.slice(LOCAL_KEY_PREFIX.length));
      if (board) boards.push(board);
    }
  } catch {
    // Storage blocked: an empty list, and the caller shows the sample.
  }
  return boards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** True when `local` is a copy Supabase hasn't got: missing there, or edited since. */
function isAhead(local: Board, remote: Board | undefined | null): boolean {
  return !remote || Date.parse(local.updatedAt) > Date.parse(remote.updatedAt);
}

export type ListResult = {
  boards: Board[];
  backend: Backend;
  warning?: string;
};

/**
 * Every stored board, most recently updated first. Same fallback rules as
 * `loadBoard`. Projects this browser has that Supabase hasn't (made before
 * Supabase was connected, or edited while it was down) are listed and sent up.
 */
export async function listBoards(): Promise<ListResult> {
  const client = getClient();

  if (client) {
    await ensureLocalDataOwner();
    const [{ data, error }] = await Promise.all([
      client.from(BOARDS_TABLE).select("id, doc").order("updated_at", { ascending: false }),
      loadRoles(client),
    ]);

    if (!error) {
      const remote = new Map<string, Board>();
      const inSupabase = new Set<string>();
      for (const row of data ?? []) {
        inSupabase.add(row.id as string);
        markSynced(row.id as string);
        const board = accept(row.doc, "Supabase");
        if (board) remote.set(board.id, board);
      }

      // Copies of projects that were in Supabase and no longer are: deleted, or
      // this person is no longer on them.
      for (const board of listLocal()) {
        if (!isLocalOnly(board.id) && !inSupabase.has(board.id) && wasSynced(board.id)) forgetBoard(board.id);
      }

      const local = listLocal();
      const ahead = local.filter(
        (board) => !isLocalOnly(board.id) && canEdit(board.id) && isAhead(board, remote.get(board.id))
      );
      const results = await Promise.all(ahead.map((board) => saveBoard(board)));
      for (const board of ahead) remote.set(board.id, board);
      // The sample lives only here, so this browser's copy is the one listed.
      for (const board of local) if (isLocalOnly(board.id)) remote.set(board.id, board);

      const boards = [...remote.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const failed = results.find((result) => result.warning);
      return failed
        ? { boards, backend: "local", warning: failed.warning }
        : { boards, backend: "supabase" };
    }

    return {
      boards: listLocal(),
      backend: "local",
      warning: `Supabase unavailable (${error.message}). Showing projects saved in this browser.`,
    };
  }

  return { boards: listLocal(), backend: "local" };
}

export type LoadResult = {
  board: Board | null;
  backend: Backend;
  /** The signed-in person's role, when the project is in Supabase. */
  role?: ProjectRole | null;
  /** Present when Supabase was configured but unreachable/unmigrated. */
  warning?: string;
};

/**
 * Loads the board. Prefers Supabase; on any failure (missing table, network,
 * RLS) it degrades to localStorage and reports why. When this browser's copy
 * is newer than Supabase's, or Supabase has none, this browser's copy is the
 * one shown, and it is sent up.
 */
export async function loadBoard(boardId: string): Promise<LoadResult> {
  const client = isLocalOnly(boardId) ? null : getClient();
  if (client) await ensureLocalDataOwner();
  const local = readLocal(boardId);

  if (client) {
    const [{ data, error }, role] = await Promise.all([
      client.from(BOARDS_TABLE).select("doc").eq("id", boardId).maybeSingle(),
      loadRole(client, boardId),
    ]);

    if (!error) {
      const remote = accept(data?.doc, "Supabase");
      // Deleted, or this person is no longer on it: the caller opens the sample.
      if (!data && wasSynced(boardId)) {
        forgetBoard(boardId);
        return { board: null, backend: "supabase", role: null };
      }
      if (data) markSynced(boardId);
      // A viewer's copy is never sent up: Supabase's is the one shown.
      if (local && role !== "viewer" && isAhead(local, remote)) {
        const saved = await saveBoard(local);
        return { board: local, backend: saved.backend, role, warning: saved.warning };
      }
      // Keep this browser's copy current, for when Supabase is unreachable.
      if (remote) writeLocal(remote);
      return { board: remote, backend: "supabase", role };
    }

    return {
      board: local,
      backend: "local",
      warning: `Supabase unavailable (${error.message}). Editing against local storage.`,
    };
  }

  return { board: local, backend: "local" };
}

export type SaveResult = {
  backend: Backend;
  warning?: string;
};

/**
 * Saves the whole board document. Writes localStorage first so there is always
 * a local copy, then mirrors to Supabase when available.
 */
export async function saveBoard(board: Board): Promise<SaveResult> {
  if (!canEdit(board.id)) return { backend: "supabase", warning: VIEW_ONLY_WARNING };
  writeLocal(board);

  const client = isLocalOnly(board.id) ? null : getClient();
  if (!client) return { backend: "local" };

  const { error } = await client.from(BOARDS_TABLE).upsert(
    {
      id: board.id,
      product_name: board.productName,
      status: board.status,
      doc: board,
      updated_at: board.updatedAt,
    },
    { onConflict: "id" }
  );

  if (error) {
    return {
      backend: "local",
      warning: `Supabase save failed (${error.message}). Saved locally instead.`,
    };
  }

  markSynced(board.id);
  return { backend: "supabase" };
}
