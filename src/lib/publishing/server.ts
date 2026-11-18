/**
 * Reads a published project for its public page. Server only.
 *
 * Goes through the `get_published` database function, never the tables, so a
 * viewer can only ever reach the live copy behind the link they were given.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { migrateBoard } from "@/lib/product-board/migrate";
import { isBoardCompatible, type Board } from "@/lib/product-board/schema";
import { SAMPLE_SLUG, samplePublishedProject } from "./sample";
import type { PublishedProject } from "./types";

/** A copy published by an older version of the app is brought up to date, or dropped. */
function asBoard(value: unknown): Board | null {
  if (isBoardCompatible(value)) return value;
  return migrateBoard(value);
}

type Row = {
  version: number;
  doc: unknown;
  note: string | null;
  publishedAt: string;
  previous: { version: number; doc: unknown; publishedAt: string } | null;
};

/**
 * The live copy behind a link, or null when the link is unknown, the project
 * was unpublished, or Supabase isn't configured. Cached per request, so the
 * page and its metadata share one database call.
 */
export const getPublishedProject = cache(async (slug: string): Promise<PublishedProject | null> => {
  if (slug === SAMPLE_SLUG) return samplePublishedProject();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc("get_published", { p_slug: slug });
  if (error) {
    console.error(`[publishing] get_published failed: ${error.message}`);
    return null;
  }

  const row = data as Row | null;
  const doc = row ? asBoard(row.doc) : null;
  if (!row || !doc) return null;

  const previousDoc = row.previous ? asBoard(row.previous.doc) : null;
  return {
    version: row.version,
    doc,
    note: row.note,
    publishedAt: row.publishedAt,
    previous:
      row.previous && previousDoc
        ? { version: row.previous.version, doc: previousDoc, publishedAt: row.previous.publishedAt }
        : null,
  };
});
