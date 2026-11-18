"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, MoreHorizontalIcon, type LucideIcon } from "lucide-react";

import { SectionLink } from "@/components/section-link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * The page template every project page follows, top to bottom:
 *
 *   eyebrow (where you are)                         ⋯ secondary actions
 *   Title
 *   One sentence: the question this page answers.
 *   [ One primary action ]
 *
 * One filled button per page, at most. Everything else a page can do goes in
 * the ⋯ menu so the page states its purpose before it asks for anything.
 */

export type OverflowItem = {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  href?: string;
  /** Renders as a checkable item, for view filters. */
  checked?: boolean;
  disabled?: boolean;
  /** Shown in red, for actions that remove something. */
  destructive?: boolean;
};

export type OverflowGroup = {
  label?: string;
  items: OverflowItem[];
};

type PageHeaderProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The page's single primary action. Leave empty when the page only reads or edits in place. */
  action?: React.ReactNode;
  /** Shown instead of an action, e.g. "Click any text to edit it." */
  hint?: React.ReactNode;
  overflow?: OverflowGroup[];
  back?: { label: string; href: string };
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  hint,
  overflow,
  back,
  className,
}: PageHeaderProps) {
  const hasOverflow = overflow?.some((group) => group.items.length > 0);

  return (
    <header className={cn("flex flex-col gap-1.5", className)}>
      {back && (
        <Link
          href={back.href}
          className="-ml-1 mb-1 inline-flex w-fit items-center gap-0.5 rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        {hasOverflow && <OverflowMenu groups={overflow!} />}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      {description && (
        <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action ? (
        <div className="mt-3 flex">{action}</div>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </header>
  );
}

/** A primary-styled button that navigates. Base UI needs `nativeButton={false}` for non-button elements. */
export function LinkButton({
  href,
  children,
  ...props
}: { href: string; children: React.ReactNode } & Omit<
  React.ComponentProps<typeof Button>,
  "render" | "nativeButton"
>) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} {...props}>
      {children}
    </Button>
  );
}

function OverflowMenu({ groups }: { groups: OverflowGroup[] }) {
  const router = useRouter();
  const visible = groups.filter((group) => group.items.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon-sm" aria-label="More actions" />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        {visible.map((group, groupIndex) => (
          <React.Fragment key={group.label ?? groupIndex}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const select = () => {
                  if (item.onSelect) item.onSelect();
                  else if (item.href) router.push(item.href);
                };
                if (item.checked !== undefined) {
                  return (
                    <DropdownMenuCheckboxItem
                      key={item.label}
                      checked={item.checked}
                      onCheckedChange={select}
                      disabled={item.disabled}
                    >
                      {item.label}
                    </DropdownMenuCheckboxItem>
                  );
                }
                return (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={select}
                    disabled={item.disabled}
                    variant={item.destructive ? "destructive" : "default"}
                  >
                    {Icon && <Icon />}
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The single reading column. Spare width stays empty on purpose: a page that
 * asks for one thing shouldn't spread across the screen.
 */
export function PageColumn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 lg:px-6 lg:py-8", className)}>
        {children}
      </div>
    </div>
  );
}

/** Small uppercase label above a list or block. */
export function SectionLabel({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {children}
      </h2>
      {aside}
    </div>
  );
}

/**
 * A list of rows. Each row is a link or a button that opens its detail one
 * level down — a drill-in page or a side panel, never a pane beside the list.
 */
export function RowList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col divide-y border-y">{children}</div>;
}

type RowProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  lead?: React.ReactNode;
  trail?: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

export function Row({ title, description, lead, trail, href, onClick }: RowProps) {
  const interactive = Boolean(href || onClick);
  const body = (
    <>
      {lead}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm leading-snug font-medium">{title}</span>
        {description && (
          <span className="text-[13px] leading-snug text-muted-foreground">{description}</span>
        )}
      </span>
      {trail}
      {interactive && <ChevronRightGlyph />}
    </>
  );
  const className = cn(
    "flex min-h-12 w-full items-center gap-3 px-1.5 py-2.5 text-left",
    interactive && "transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
  );

  if (href) {
    return (
      <SectionLink href={href} className={className}>
        {body}
      </SectionLink>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function ChevronRightGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

/** Folded supporting detail: shut by default, one click to open. It slides open and shut. */
export function MoreDetail({
  label,
  count,
  children,
  defaultOpen = false,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-y">
      <CollapsibleTrigger className="group/more flex min-h-12 w-full cursor-pointer items-center justify-between px-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
        <span>
          {label}
          {count !== undefined && <span className="tabular-nums"> ({count})</span>}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-3.5 shrink-0 transition-transform duration-200 ease-out group-data-[panel-open]/more:rotate-90 motion-reduce:transition-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="pb-6">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

/** The hand-off at the bottom of a page: where to go next. */
export function NextStep({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href: string;
}) {
  return (
    <SectionLink
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3.5 transition-colors hover:bg-muted"
    >
      <span className="flex flex-col">
        <span className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <span className="text-sm font-medium">{title}</span>
        {description && <span className="text-[13px] text-muted-foreground">{description}</span>}
      </span>
      <ChevronRightGlyph />
    </SectionLink>
  );
}
