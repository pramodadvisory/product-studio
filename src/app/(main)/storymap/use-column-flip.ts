"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

// FLIP (First, Last, Invert, Play) for the story map's columns.
//
// A "column" isn't a single element — one feature owns a header cell plus one
// cell in every sprint row and both backlog rows. Reordering rewrites the grid
// flow, so all of those land in new positions at once and would otherwise jump.
//
// So: measure every tagged cell before the state change, let React re-render,
// then invert each cell by its own delta and animate the offset away. Cells
// belonging to the same column share a delta, so the column reads as one piece
// sliding across the board.
//
// Tag participating cells with `data-flip-key="<stable unique id>"` and call
// `captureColumns()` immediately before the reordering setState.

const DURATION_MS = 280;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function useColumnFlip() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Non-null only between a capture and the layout effect that consumes it,
  // which is what keeps this from animating on unrelated renders.
  const firstRects = useRef<Map<string, { left: number; width: number }> | null>(
    null
  );

  const cells = () =>
    Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-flip-key]") ?? []
    );

  const captureColumns = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      firstRects.current = null;
      return;
    }

    const rects = new Map<string, { left: number; width: number }>();
    for (const cell of cells()) {
      const key = cell.dataset.flipKey;
      if (!key) continue;
      const { left, width } = cell.getBoundingClientRect();
      rects.set(key, { left, width });
    }
    firstRects.current = rects;
  }, []);

  useLayoutEffect(() => {
    const first = firstRects.current;
    if (!first) return;
    firstRects.current = null;

    for (const cell of cells()) {
      const key = cell.dataset.flipKey;
      if (!key) continue;

      const before = first.get(key);
      if (!before) continue; // column is new — nothing to move from

      const after = cell.getBoundingClientRect();
      const dx = before.left - after.left;
      // Goal headers span their features, so reassigning a feature between
      // goals resizes them rather than moving them. Interpolate both.
      const resized = Math.abs(before.width - after.width) >= 1;
      if (Math.abs(dx) < 1 && !resized) continue;

      cell.animate(
        [
          {
            transform: `translateX(${dx}px)`,
            ...(resized && { width: `${before.width}px` }),
          },
          {
            transform: "translateX(0px)",
            ...(resized && { width: `${after.width}px` }),
          },
        ],
        { duration: DURATION_MS, easing: EASING }
      );
    }
  });

  return { containerRef, captureColumns };
}
