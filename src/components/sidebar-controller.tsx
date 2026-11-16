"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarController() {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const previousPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Only update sidebar when pathname actually changes
    if (previousPathnameRef.current !== pathname) {
      // The story map is the one full-width canvas; everything else reads in a
      // single column and keeps the sidebar visible.
      if (pathname === "/develop/story-map") {
        setOpen(false);
      } else {
        // Open sidebar on other pages
        setOpen(true);
      }
      previousPathnameRef.current = pathname;
    }
  }, [pathname, setOpen]);

  return null;
}
