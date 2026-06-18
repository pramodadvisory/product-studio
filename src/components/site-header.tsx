"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 self-center data-vertical:h-4"
        />
        <div className="flex gap-2">
          <Button
            variant={pathname === "/docs" ? "default" : "ghost"}
            onClick={() => router.push("/docs")}
          >
            Docs
          </Button>
          <Button
            variant={pathname === "/tasks" ? "default" : "ghost"}
            onClick={() => router.push("/tasks")}
          >
            Tasks
          </Button>
          <Button
            variant={pathname === "/metrics" ? "default" : "ghost"}
            onClick={() => router.push("/metrics")}
          >
            Metrics
          </Button>
          <Button
            variant={pathname === "/agents" ? "default" : "ghost"}
            onClick={() => router.push("/agents")}
          >
            Agents
          </Button>
        </div>
      </div>
    </header>
  );
}
