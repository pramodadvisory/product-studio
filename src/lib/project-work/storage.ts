import {
  VIEW_ONLY_WARNING,
  canEdit,
  ensureLocalDataOwner,
  getSupabaseClient,
  isLocalOnly,
  type Backend,
} from "@/lib/product-board/storage";

/**
 * Persistence for a project's work outside the board: the decision log,
 * experiments, the story map and sprints. One JSON document per project and
 * kind, in the `project_work` table (see supabase/migrations/0003).
 *
 * Like the board, every save writes this browser first and then Supabase, so
 * nothing is lost when Supabase is down or not configured. Each copy carries
 * the time it was saved, so the newer one wins when the two disagree.
 *
 * As with the board, the sample project's work stays in this browser, and a
 * viewer's edits aren't saved (the database would refuse them anyway).
 */
export type WorkKind = "decisions" | "experiments" | "story_map" | "sprints";

export const WORK_TABLE = "project_work";

/** A document and when it was saved (ISO 8601). */
export type Stamped<T> = { doc: T; updatedAt: string };

const LOCAL_KEY_PREFIX = "product-studio:work:";

/** Data saved by older versions carries no time, so any saved copy beats it. */
const LONG_AGO = new Date(0).toISOString();

function localKey(projectId: string, kind: WorkKind) {
  return `${LOCAL_KEY_PREFIX}${projectId}:${kind}`;
}

export function isNewer(a: Stamped<unknown>, b: Stamped<unknown>): boolean {
  return Date.parse(a.updatedAt) > Date.parse(b.updatedAt);
}

/**
 * This browser's copy, or null. `legacyKey` is where an older version kept the
 * bare document (no time); it's read only when there's no current copy.
 */
export function readLocalWork<T>(projectId: string, kind: WorkKind, legacyKey?: string): Stamped<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localKey(projectId, kind));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stamped<T>>;
      if (parsed && "doc" in parsed && typeof parsed.updatedAt === "string") {
        return { doc: parsed.doc as T, updatedAt: parsed.updatedAt };
      }
    }
    if (legacyKey) {
      const legacy = window.localStorage.getItem(legacyKey);
      if (legacy) return { doc: JSON.parse(legacy) as T, updatedAt: LONG_AGO };
    }
  } catch {
    // Blocked storage or a corrupt entry: treat as nothing saved here.
  }
  return null;
}

export function writeLocalWork<T>(projectId: string, kind: WorkKind, value: Stamped<T>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localKey(projectId, kind), JSON.stringify(value));
  } catch {
    // Quota or private mode: Supabase still has it if it's configured.
  }
}

const KINDS: WorkKind[] = ["decisions", "experiments", "story_map", "sprints"];

/** Drops this browser's copies of a project's work, after it has been deleted or left. */
export function forgetWork(projectId: string) {
  if (typeof window === "undefined") return;
  try {
    for (const kind of KINDS) window.localStorage.removeItem(localKey(projectId, kind));
  } catch {
    // Storage blocked: nothing was kept.
  }
}

export type RemoteWork<T> =
  | { ok: true; value: Stamped<T> | null }
  /** `error` is null when Supabase simply isn't configured. */
  | { ok: false; error: string | null };

/** Supabase's copy. `ok: false` when Supabase isn't configured or can't be read. */
export async function loadRemoteWork<T>(projectId: string, kind: WorkKind): Promise<RemoteWork<T>> {
  const client = isLocalOnly(projectId) ? null : getSupabaseClient();
  if (!client) return { ok: false, error: null };
  await ensureLocalDataOwner();

  const { data, error } = await client
    .from(WORK_TABLE)
    .select("doc, updated_at")
    .eq("board_id", projectId)
    .eq("kind", kind)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, value: null };
  return {
    ok: true,
    value: { doc: data.doc as T, updatedAt: new Date(data.updated_at as string).toISOString() },
  };
}

export type WorkSaveResult = { backend: Backend; warning?: string };

/** Saves to this browser, then to Supabase when it's configured. */
export async function saveWork<T>(projectId: string, kind: WorkKind, value: Stamped<T>): Promise<WorkSaveResult> {
  if (!canEdit(projectId)) return { backend: "supabase", warning: VIEW_ONLY_WARNING };
  writeLocalWork(projectId, kind, value);

  const client = isLocalOnly(projectId) ? null : getSupabaseClient();
  if (!client) return { backend: "local" };

  const { error } = await client
    .from(WORK_TABLE)
    .upsert(
      { board_id: projectId, kind, doc: value.doc, updated_at: value.updatedAt },
      { onConflict: "board_id,kind" }
    );

  if (error) {
    return { backend: "local", warning: `Supabase save of ${kind} failed (${error.message}). Saved in this browser.` };
  }
  return { backend: "supabase" };
}
