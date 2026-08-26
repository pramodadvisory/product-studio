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
      // Close sidebar when on storymap or metrics page
      if (pathname === "/storymap" || pathname === "/metrics") {
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
