"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Density = "summary" | "full";

const ANCHOR_PREFIX = "pb-anchor-";

export function anchorId(id: string) {
  return `${ANCHOR_PREFIX}${id}`;
}

export function scrollToSection(id: string) {
  document.getElementById(anchorId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Tracks which anchored group is currently in view so the rail can highlight it.
 * Observes against the board's own scroll container, not the window. Re-arms
 * whenever the id set changes, which is also what handles switching tabs.
 *
 * Takes the container as a *node*, not a ref: the ids are populated while the
 * empty state is still on screen, so a ref would read null and the effect would
 * never re-run once the real container mounted.
 */
export function useActiveSection(ids: string[], root: HTMLElement | null) {
  const [observed, setObserved] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!root || !list.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (first) setObserved(first.target.id.replace(ANCHOR_PREFIX, ""));
      },
      // Bias towards whatever is near the top of the reading area.
      { root, rootMargin: "-12% 0px -70% 0px", threshold: 0 }
    );

    for (const id of list) {
      const el = root.querySelector(`#${anchorId(id)}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [key, root]);

  // Derived rather than stored, so no setState-in-effect is needed: right after
  // a tab switch `observed` still names a group from the previous tab, and
  // falling back to the first id gives the correct highlight immediately.
  return observed && ids.includes(observed) ? observed : (ids[0] ?? "");
}

// ───────────────────────────────────────────────────────────────────── rail

/**
 * In-tab table of contents, listing the groups of the active section.
 *
 * Sits in the right gutter of the board column.
 *
 * `self-start` is load-bearing: as a flex child the nav would otherwise stretch
 * to the container's full height, leaving `position: sticky` no room to travel.
 */
export function GroupRail({
  groups,
  activeId,
  density,
}: {
  groups: { id: string; title: string; count: number }[];
  activeId: string;
  density: Density;
}) {
  if (!groups.length) return null;

  return (
    <nav
      aria-label="On this section"
      className="sticky top-6 hidden w-48 shrink-0 self-start lg:block"
    >
      <p className="mb-2 pl-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/55">
        On this section
      </p>
      <ul className="space-y-0.5 border-l">
        {groups.map((group) => {
          const active = group.id === activeId;
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => scrollToSection(group.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "-ml-px flex w-full items-center justify-between gap-2 border-l-2 py-1.5 pl-3 pr-2 text-left text-sm transition-colors",
                  active
                    ? "border-l-primary font-medium text-foreground"
                    : "border-l-transparent text-foreground/65 hover:border-l-border hover:text-foreground"
                )}
              >
                <span className="truncate">{group.title}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-foreground/50">
                  {group.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {density === "summary" && (
        <p className="mt-3 pl-3 text-[11px] leading-relaxed text-foreground/55">
          Headline blocks only.
        </p>
      )}
    </nav>
  );
}
