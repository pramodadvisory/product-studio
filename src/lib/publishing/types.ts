import type { Board } from "@/lib/product-board/schema";

/** Where a project stands with publishing, for the editor's Publish button. */
export type PublicationStatus = {
  /** The project's public link segment (/p/<slug>). Kept after unpublishing. */
  slug: string | null;
  /** The version viewers see; null when not published. */
  liveVersion: number | null;
  /** The newest version ever published, live or not. */
  latestVersion: number | null;
  publishedAt: string | null;
  /** The board's own `updatedAt` inside the live copy. */
  sourceUpdatedAt: string | null;
};

export type PublishResult = {
  slug: string;
  version: number;
  publishedAt: string;
};

/** What the public link returns. */
export type PublishedProject = {
  version: number;
  doc: Board;
  note: string | null;
  publishedAt: string;
  previous: { version: number; doc: Board; publishedAt: string } | null;
};

export function publishedPath(slug: string): string {
  return `/p/${slug}`;
}
