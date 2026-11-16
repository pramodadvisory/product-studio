"use client";

import * as React from "react";
import { ChevronDownIcon, InfoIcon } from "lucide-react";

import { scrollToSection, SectionLink } from "@/components/section-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Wayfinding for a published project: a contents rail beside the page on
 * wide screens, a sticky "jump to" bar on phones. Entries lead with the
 * reader's question ("What could go wrong?") and name the section under it,
 * and the section being read is highlighted as you scroll.
 */
export type NavItem = { id: string; label: string; hint?: string };
export type NavGroup = { label?: string; items: NavItem[] };

/** How far below the top of the window a section counts as "being read". */
const READING_LINE = 120;

function useActiveSection(groups: NavGroup[]): string {
  const ids = React.useMemo(() => groups.flatMap((g) => g.items.map((i) => i.id)), [groups]);
  const [active, setActive] = React.useState(ids[0] ?? "");

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READING_LINE) current = id;
      }
      // At the very bottom the last section is the one being read, even when
      // it is too short for its top to reach the reading line.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && ids.length) current = ids[ids.length - 1];
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return active;
}

export function ContentsRail({
  productName,
  version,
  groups,
}: {
  productName: string;
  version: number;
  groups: NavGroup[];
}) {
  const active = useActiveSection(groups);

  return (
    <nav aria-label="Contents" className="sticky top-0 flex max-h-svh flex-col gap-6 overflow-y-auto py-14 pr-2">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Published · v{version}
        </span>
        <span className="text-sm leading-snug font-semibold">{productName}</span>
      </div>

      {groups.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-1.5">
          {group.label && (
            <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {group.label}
            </span>
          )}
          <ul className="flex flex-col border-l">
            {group.items.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <SectionLink
                    href={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "-ml-px flex flex-col gap-0.5 border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors",
                      isActive
                        ? "border-foreground font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {item.hint && <span className="text-xs font-normal text-muted-foreground">{item.hint}</span>}
                  </SectionLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <SectionLink
        href="#how-to-read"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <InfoIcon className="size-3.5" />
        How to read this
      </SectionLink>
    </nav>
  );
}

export function JumpBar({ productName, groups }: { productName: string; groups: NavGroup[] }) {
  const active = useActiveSection(groups);
  const activeLabel = groups.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? "Contents";

  const jump = (id: string) => {
    window.history.pushState(null, "", `#${id}`);
    scrollToSection(id);
  };

  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="flex h-12 items-center gap-3 px-4">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{productName}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="max-w-[60%] gap-1"
                aria-label={`Jump to a section. Now reading: ${activeLabel}`}
              />
            }
          >
            <span className="truncate">{activeLabel}</span>
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[70svh] w-72 overflow-y-auto">
            {groups.map((group, index) => (
              <React.Fragment key={group.label ?? index}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
                  {group.items.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => jump(item.id)}
                      className={cn("flex-col items-start gap-0", item.id === active && "font-medium")}
                    >
                      <span>{item.label}</span>
                      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </React.Fragment>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => jump("how-to-read")}>
              <InfoIcon />
              How to read this
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
