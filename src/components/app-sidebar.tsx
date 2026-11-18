"use client"

import * as React from "react"
import Link from "next/link"
import { SectionLink } from "@/components/section-link"
import { usePathname, useRouter } from "next/navigation"
import { CheckIcon, ChevronsUpDownIcon, FolderOpenIcon, PlusIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  useProjectBoard,
  useProjectDecisions,
  useProjectProgress,
  type ProjectProgress,
} from "@/components/project-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { LIBRARY_ITEMS, OVERVIEW_ITEM, STAGES, isActivePath, pageUrl } from "@/lib/navigation"
import type { Board } from "@/lib/product-board/schema"
import { answerProgress } from "@/lib/questions"

const ROLE_LABEL = { owner: null, editor: "Editor", viewer: "View only" } as const

/**
 * Project navigation: which project you're in, Overview, the five stages in
 * order, and the Library. Only the stage you're in expands to show its pages
 * (for Discover and Define, the sections of its report). A complete stage
 * gets a green check; otherwise the focus stage is marked. A badge appears
 * only when something is waiting on you.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { board, role } = useProjectBoard()
  const { decisions } = useProjectDecisions()
  const project = useProjectProgress()

  const waitingDecisions = decisions.filter((d) => d.status === "proposed").length
  const engagement = project?.projectType === "engagement"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <ProjectSwitcher
          name={board?.productName ?? "Loading project…"}
          type={engagement ? "Client engagement" : "Product"}
          access={role ? ROLE_LABEL[role] : null}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[OVERVIEW_ITEM]} />
        <StageNav project={project} board={board} engagement={engagement} />
        <NavMain label="Library" items={LIBRARY_ITEMS} badges={{ "/decisions": waitingDecisions }} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

function StageNav({
  project,
  board,
  engagement,
}: {
  project: ProjectProgress | null
  board: Board | null
  engagement: boolean
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Stages</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {STAGES.map((stage) => {
            const inStage = isActivePath(pathname, stage.url)
            const onHub = pathname === stage.url
            const signedOff = Boolean(engagement && board?.signoffs?.[stage.id])
            const complete = Boolean(project?.progress[stage.id].complete)
            return (
              <SidebarMenuItem key={stage.id}>
                <SidebarMenuButton
                  isActive={onHub}
                  tooltip={stage.name}
                  render={<Link href={stage.url} aria-current={onHub ? "page" : undefined} />}
                  className={inStage ? "font-medium" : undefined}
                >
                  <span
                    aria-hidden
                    className="flex size-4 shrink-0 items-center justify-center rounded-full border border-current/30 font-mono text-[10px] leading-none text-sidebar-foreground/70 group-data-[active]/menu-button:border-current group-data-[active]/menu-button:text-sidebar-foreground"
                  >
                    {stage.step}
                  </span>
                  <span className="flex-1">{stage.name}</span>
                  {signedOff || complete ? (
                    <CheckIcon
                      aria-label={signedOff ? "Signed off" : "Complete"}
                      className="ml-auto text-emerald-600 dark:text-emerald-400"
                    />
                  ) : project?.focus === stage.id ? (
                    <span className="ml-auto font-mono text-[10px] tracking-wide text-sidebar-foreground/60 uppercase">
                      Focus
                    </span>
                  ) : null}
                </SidebarMenuButton>
                {inStage && (
                  <SidebarMenuSub>
                    {stage.pages.map((page) => {
                      const url = pageUrl(stage, page)
                      const active = isActivePath(pathname, url)
                      const sectionDone = Boolean(
                        stage.report && board && answerProgress(board, stage.id, page.slug).complete
                      )
                      return (
                        <SidebarMenuSubItem key={page.slug}>
                          <SidebarMenuSubButton
                            isActive={active}
                            render={<SectionLink href={url} aria-current={active ? "page" : undefined} />}
                          >
                            <span>{page.title}</span>
                            {sectionDone && (
                              // Wrapped: the sub-button recolours its direct svg children.
                              <span className="ml-auto text-emerald-600 dark:text-emerald-400">
                                <CheckIcon aria-label="All answered" className="size-4" />
                              </span>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/** `access` names the signed-in person's role when they aren't the owner. */
function ProjectSwitcher({ name, type, access }: { name: string; type: string; access: string | null }) {
  const router = useRouter()
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-sidebar-accent" />}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials}
            </span>
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {access ? `${type} · ${access}` : type}
              </span>
            </span>
            <ChevronsUpDownIcon className="ml-auto text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" side="bottom" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push("/projects")}>
                <FolderOpenIcon />
                All projects
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/projects?new=1")}>
              <PlusIcon />
              New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
