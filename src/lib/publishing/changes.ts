/**
 * What changed between two published versions, in words a reader can scan:
 * "Unit Economics: 2 added, 1 changed", "Pricing: now Validated (was
 * Assumption)". Only what a reader can see counts (see `visibleBlocks`), and
 * bookkeeping fields such as edit times are ignored.
 */
import { CONFIDENCE_LABEL, type Block, type Board } from "@/lib/product-board/schema";
import { visibleBlocks, type PublishedSection } from "./content";

export type SectionChanges = {
  /** The section's anchor on the published page. */
  slug: string;
  title: string;
  lines: string[];
};

export type Changes = {
  headline: string[];
  sections: SectionChanges[];
};

/** Fields that change without the content changing. */
const IGNORED = new Set(["updatedAt", "updatedBy", "emphasis", "size", "inSummary"]);

/**
 * JSON with sorted keys. Both versions come back from Postgres jsonb, which
 * reorders keys, so plain JSON.stringify can't be trusted to compare them.
 */
function stable(value: unknown, ignore?: Set<string>): string {
  if (Array.isArray(value)) return `[${value.map((v) => stable(v)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key, v]) => v !== undefined && !ignore?.has(key))
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function itemsOf(block: Block): { id: string }[] {
  return block.type === "chart" ? block.rows : block.type === "statement" ? [] : block.items;
}

function plural(count: number, word: string) {
  return `${count} ${word}`;
}

/** Lines for a block a reader could see in both versions; none if it didn't change. */
function describeBlock(before: Block, after: Block): string[] {
  const lines: string[] = [];

  if (before.confidence !== after.confidence && after.confidence) {
    lines.push(
      before.confidence
        ? `${after.title}: now ${CONFIDENCE_LABEL[after.confidence]} (was ${CONFIDENCE_LABEL[before.confidence]})`
        : `${after.title}: now ${CONFIDENCE_LABEL[after.confidence]}`
    );
  }

  const withoutConfidence = new Set([...IGNORED, "confidence"]);
  if (stable(before, withoutConfidence) === stable(after, withoutConfidence)) return lines;

  const was = new Map(itemsOf(before).map((item) => [item.id, stable(item)]));
  const now = itemsOf(after);
  const added = now.filter((item) => !was.has(item.id)).length;
  const changed = now.filter((item) => was.has(item.id) && was.get(item.id) !== stable(item)).length;
  const removed = [...was.keys()].filter((id) => !now.some((item) => item.id === id)).length;

  const parts = [
    added && plural(added, "added"),
    changed && plural(changed, "changed"),
    removed && plural(removed, "removed"),
  ].filter(Boolean);

  lines.push(parts.length ? `${after.title}: ${parts.join(", ")}` : `${after.title}: updated`);
  return lines;
}

export function describeChanges(previous: Board, current: Board): Changes {
  const before = visibleBlocks(previous);
  const after = visibleBlocks(current);
  const bySection = new Map<string, SectionChanges>();

  const note = (section: PublishedSection, line: string) => {
    const key = section.page.slug;
    const entry = bySection.get(key) ?? { slug: key, title: section.page.title, lines: [] };
    entry.lines.push(line);
    bySection.set(key, entry);
  };

  for (const [id, { block, section }] of after) {
    const old = before.get(id);
    if (!old) note(section, `${block.title}: new`);
    else for (const line of describeBlock(old.block, block)) note(section, line);
  }
  // Removed blocks are listed under the section they were in, which may no
  // longer be on the page (the page then shows it without a link).
  for (const [id, { block, section }] of before) {
    if (!after.has(id)) note(section, `${block.title}: removed`);
  }

  const headline: string[] = [];
  const oldHeadline = new Map(previous.headline.map((h) => [h.id, h]));
  for (const h of current.headline) {
    const old = oldHeadline.get(h.id);
    if (!old) {
      if (h.value.trim()) headline.push(`${h.label}: ${h.value}`);
    } else if (old.value !== h.value) {
      headline.push(old.value.trim() ? `${h.label}: ${old.value} → ${h.value}` : `${h.label}: ${h.value}`);
    }
  }

  // Keep the page's order rather than the order changes were found in.
  const order = [...after.values(), ...before.values()].map((v) => v.section.page.slug);
  const sections = [...bySection.values()].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return { headline, sections };
}
