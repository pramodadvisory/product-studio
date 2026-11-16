import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { migrateBoard } from "./migrate";
import { isBoardCompatible, type Board } from "./schema";

/**
 * Persistence for the product board.
 *
 * The board is one JSON document, so a save is a single upsert. Supabase is used
 * when it is configured; otherwise we fall back to localStorage so edits are
 * never silently lost on a machine without env vars. `backend` is surfaced in
 * the UI so the distinction is always visible to the user.
 *
 * Note: this deliberately does NOT import `@/lib/supabase`, which throws at
 * module load when env vars are absent and would take the whole page down.
 */
export type Backend = "supabase" | "local";

export const BOARDS_TABLE = "product_boards";
const LOCAL_KEY_PREFIX = "product-board:";

let clientCache: SupabaseClient | null | undefined;

/** Returns null (rather than throwing) when Supabase isn't configured. */
function getClient(): SupabaseClient | null {
  if (clientCache !== undefined) return clientCache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  clientCache = url && key ? createClient(url, key) : null;
  return clientCache;
}

export function isSupabaseConfigured(): boolean {
  return getClient() !== null;
}

function localKey(boardId: string) {
  return `${LOCAL_KEY_PREFIX}${boardId}`;
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

export type ListResult = {
  boards: Board[];
  backend: Backend;
  warning?: string;
};

/** Every stored board, most recently updated first. Same fallback rules as `loadBoard`. */
export async function listBoards(): Promise<ListResult> {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from(BOARDS_TABLE)
      .select("doc")
      .order("updated_at", { ascending: false });

    if (!error) {
      const boards = (data ?? [])
        .map((row) => accept(row.doc, "Supabase"))
        .filter((board): board is Board => Boolean(board));
      return { boards, backend: "supabase" };
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
  /** Present when Supabase was configured but unreachable/unmigrated. */
  warning?: string;
};

/**
 * Loads the board. Prefers Supabase; on any failure (missing table, network,
 * RLS) it degrades to localStorage and reports why.
 */
export async function loadBoard(boardId: string): Promise<LoadResult> {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from(BOARDS_TABLE)
      .select("doc")
      .eq("id", boardId)
      .maybeSingle();

    if (!error) {
      return { board: accept(data?.doc, "Supabase"), backend: "supabase" };
    }

    return {
      board: readLocal(boardId),
      backend: "local",
      warning: `Supabase unavailable (${error.message}). Editing against local storage.`,
    };
  }

  return { board: readLocal(boardId), backend: "local" };
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
  writeLocal(board);

  const client = getClient();
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

  return { backend: "supabase" };
}
