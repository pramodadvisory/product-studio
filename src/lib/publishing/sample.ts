/**
 * The sample project's fixed demo link, /p/sample.
 *
 * Works without Supabase, so the published view can be shown in a demo on
 * any machine. It shows the built-in sample project (not anyone's edits to
 * it, which live in their own browser), as version 2, with an invented
 * version 1 so "What changed" has something to show. Real links are 20 hex
 * characters, so "sample" can never collide with one.
 */
import type { Board } from "@/lib/product-board/schema";
import { SEED_BOARD } from "@/lib/product-board/seed";
import type { PublishedProject } from "./types";

export const SAMPLE_SLUG = "sample";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Version 1: the sample as it might have looked before a round of client interviews. */
function earlierVersion(board: Board): Board {
  const earlier = structuredClone(board);
  const arr = earlier.headline.find((h) => h.id === "h-arr");
  if (arr) arr.value = "$400K";

  for (const section of earlier.sections) {
    for (const group of section.groups) {
      for (const block of group.blocks) {
        if (block.id === "b-pricing") block.confidence = "validated";
        if (block.id === "b-unit-economics" && block.type === "metrics") {
          const acv = block.items.find((item) => item.label === "ACV");
          if (acv) acv.value = "$12,000";
        }
        if (block.id === "b-risks" && block.type === "records") block.items = block.items.slice(0, -2);
      }
    }
  }
  return earlier;
}

export function samplePublishedProject(now = Date.now()): PublishedProject {
  const doc = structuredClone(SEED_BOARD);
  return {
    version: 2,
    doc,
    note: "Pricing is now decided, after six client interviews. Two new risks came out of those conversations.",
    publishedAt: new Date(now - 2 * DAY_MS).toISOString(),
    previous: {
      version: 1,
      doc: earlierVersion(doc),
      publishedAt: new Date(now - 12 * DAY_MS).toISOString(),
    },
  };
}
