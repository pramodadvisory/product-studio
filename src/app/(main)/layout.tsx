"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarController } from "@/components/sidebar-controller";
import { HeaderTitleProvider } from "@/components/header-title-context";
import { ProjectDataProvider } from "@/components/project-data";
import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { AssistantPanel } from "@/components/assistant/assistant-panel";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProjectDataProvider>
      <AssistantProvider>
      <HeaderTitleProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <SidebarController />
          <AppSidebar variant="inset" />
          <SidebarInset className="min-w-0 overflow-hidden">
            <SiteHeader />
            {children}
          </SidebarInset>
          <AssistantPanel />
        </SidebarProvider>
      </HeaderTitleProvider>
      </AssistantProvider>
    </ProjectDataProvider>
  );
}
