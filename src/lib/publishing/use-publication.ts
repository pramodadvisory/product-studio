"use client";

import { useCallback, useEffect, useState } from "react";
import type { Board } from "@/lib/product-board/schema";
import { getSupabaseClient } from "@/lib/product-board/storage";
import type { PublicationStatus, PublishResult } from "./types";

const EMPTY: PublicationStatus = {
  slug: null,
  liveVersion: null,
  latestVersion: null,
  publishedAt: null,
  sourceUpdatedAt: null,
};

export type PublicationController = {
  /** Null while loading. */
  status: PublicationStatus | null;
  /** False when Supabase isn't configured: there is nowhere to publish to. */
  available: boolean;
  /** The draft has changed since the live version was published. */
  hasChanges: boolean;
  /** Set when the status couldn't be loaded (e.g. the migration hasn't run). */
  error: string | null;
  publish: (note: string) => Promise<PublishResult>;
  unpublish: () => Promise<void>;
};

/**
 * The open project's publishing state, and the two things you can do with it.
 * Publishing sends the board as the PM sees it, so a pending autosave can't
 * leave the published copy one edit behind.
 */
export function usePublication(board: Board | null): PublicationController {
  const client = getSupabaseClient();
  const boardId = board?.id ?? null;
  // Keyed by project, so switching projects shows "loading" rather than the
  // previous project's state.
  const [loaded, setLoaded] = useState<{ boardId: string; status: PublicationStatus; error: string | null } | null>(
    null
  );
  const current = loaded && loaded.boardId === boardId ? loaded : null;
  const status = current?.status ?? null;

  const setStatus = useCallback(
    (next: (prev: PublicationStatus) => PublicationStatus) => {
      if (!boardId) return;
      setLoaded((prev) => ({
        boardId,
        status: next(prev?.boardId === boardId ? prev.status : EMPTY),
        error: null,
      }));
    },
    [boardId]
  );

  useEffect(() => {
    if (!client || !boardId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await client.rpc("publication_status", { p_board_id: boardId });
      if (cancelled) return;
      setLoaded({
        boardId,
        // No row yet means the project hasn't been saved to Supabase.
        status: error ? EMPTY : ((data as PublicationStatus | null) ?? EMPTY),
        error: error?.message ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [client, boardId]);

  const publish = useCallback(
    async (note: string) => {
      if (!client || !board) throw new Error("Publishing needs Supabase.");
      const { data, error } = await client.rpc("publish_board", {
        p_board_id: board.id,
        p_doc: board,
        p_note: note,
      });
      if (error) throw new Error(error.message);
      const result = data as PublishResult;
      setStatus(() => ({
        slug: result.slug,
        liveVersion: result.version,
        latestVersion: result.version,
        publishedAt: result.publishedAt,
        sourceUpdatedAt: board.updatedAt,
      }));
      return result;
    },
    [client, board, setStatus]
  );

  const unpublish = useCallback(async () => {
    if (!client || !boardId) return;
    const { error } = await client.rpc("unpublish_board", { p_board_id: boardId });
    if (error) throw new Error(error.message);
    setStatus((prev) => ({ ...prev, liveVersion: null, publishedAt: null, sourceUpdatedAt: null }));
  }, [client, boardId, setStatus]);

  const hasChanges = Boolean(
    status?.liveVersion && board && status.sourceUpdatedAt && board.updatedAt !== status.sourceUpdatedAt
  );

  return { status, available: Boolean(client), hasChanges, error: current?.error ?? null, publish, unpublish };
}
