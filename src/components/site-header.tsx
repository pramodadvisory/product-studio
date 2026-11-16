"use client"

import * as React from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  HeaderTitleContext,
  useHeaderActionsTarget,
} from "@/components/header-title-context"
import { useProjectBoard } from "@/components/project-data"
import { useAssistant } from "@/components/assistant/assistant-provider"
import { Button } from "@/components/ui/button"
import { SparklesIcon } from "lucide-react"
import { PublishButton } from "@/components/publishing/publish-button"

/**
 * Top bar: where you are (project / page) and nothing else competing with the
 * page. Pages put their one primary action in their own PageHeader; the
 * actions slot stays for full-width workspaces such as the doc editor.
 * Publish and the assistant act on the whole project, so they are global
 * chrome, not page actions.
 */
export function SiteHeader() {
  const { title } = React.useContext(HeaderTitleContext)
  const actionsRef = useHeaderActionsTarget()
  const { board } = useProjectBoard()
  const assistant = useAssistant()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          {board && (
            <>
              <Link
                href="/overview"
                className="hidden truncate text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                {board.productName}
              </Link>
              {title && <span aria-hidden className="hidden text-muted-foreground/60 sm:inline">/</span>}
            </>
          )}
          {title && (
            <span aria-current="page" className="truncate font-medium">
              {title}
            </span>
          )}
        </nav>
        <div ref={actionsRef} className="ml-auto flex items-center gap-2" />
        <PublishButton />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          aria-expanded={assistant.isOpen}
          onClick={() => (assistant.isOpen ? assistant.close() : assistant.open())}
        >
          <SparklesIcon />
          <span className="hidden sm:inline">Ask Studio</span>
          <kbd className="hidden rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground sm:inline">⌘J</kbd>
        </Button>
      </div>
    </header>
  )
}
