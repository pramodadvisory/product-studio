"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { isActivePath, type NavItem } from "@/lib/navigation"

/**
 * A group of plain navigation links (Overview, the Library). A badge appears
 * only when something is waiting on the user. Stages have their own nav.
 */
export function NavMain({
  label,
  items,
  badges = {},
}: {
  label?: string
  items: NavItem[]
  /** Keyed by item url. Zero or missing renders nothing. */
  badges?: Record<string, number>
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActivePath(pathname, item.url)
            const badge = badges[item.url] ?? 0
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  render={<Link href={item.url} aria-current={active ? "page" : undefined} />}
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
                {badge > 0 && (
                  <SidebarMenuBadge
                    className="bg-sidebar-primary text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground"
                    aria-label={`${badge} waiting on you`}
                  >
                    {badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
