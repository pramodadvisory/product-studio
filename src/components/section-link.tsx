"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Glide to a section of the page rather than jumping to it. Falls back to an
 * instant jump for people who've asked their system for reduced motion.
 * Returns false when the section isn't on the page.
 */
export function scrollToSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  return true;
}

/**
 * A link that may point at a section (`/discover/report#customers`).
 *
 * Next.js jumps straight to a `#section` on navigation. Instead:
 * - on the same page, the click glides to the section;
 * - from another page, Next is told not to scroll, and the destination page
 *   glides to the section once it has rendered (see `StageReport`).
 *
 * Links without a `#` behave exactly like `next/link`.
 */
export function SectionLink({
  href,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();
  const hashAt = href.indexOf("#");
  if (hashAt === -1) return <Link href={href} onClick={onClick} {...props} />;

  const path = href.slice(0, hashAt) || pathname;
  const id = decodeURIComponent(href.slice(hashAt + 1));

  return (
    <Link
      href={href}
      scroll={false}
      onClick={(event) => {
        onClick?.(event);
        // Let new-tab clicks and other pages go through the normal navigation.
        if (event.defaultPrevented || path !== pathname) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.history.pushState(null, "", href);
        scrollToSection(id);
      }}
      {...props}
    />
  );
}
