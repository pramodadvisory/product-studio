"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon, PencilIcon } from "lucide-react";

import { useHeaderTitle } from "@/components/header-title-context";
import {
  LinkButton,
  PageColumn,
  PageHeader,
  Row,
  RowList,
  SectionLabel,
} from "@/components/page-header";
import {
  useProjectBoard,
  useProjectDecisions,
  useProjectExperiments,
  useProjectProgress,
} from "@/components/project-data";
import { CompletionMark } from "@/components/completion-mark";
import { ProjectDetailsDialog } from "@/components/project-details-dialog";
import { StatusPill } from "@/components/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGES } from "@/lib/navigation";
import { buildAttentionQueue, type AttentionItem } from "@/lib/overview";

/**
 * Overview — where every project opens.
 *
 * It answers one question: what needs me on this project today? The single
 * primary button is the top item's own action, so its label changes as the
 * queue does. Below that, the next few items and the five stages, each with
 * its progress (for a product) or client sign-off (for an engagement).
 */
export default function OverviewPage() {
  const { board, mutate } = useProjectBoard();
  const { decisions } = useProjectDecisions();
  const { experiments } = useProjectExperiments();
  const project = useProjectProgress();
  // Fixed for the life of the page so server and client agree on "N days ago".
  const [now] = React.useState(() => Date.now());
  const [editingDetails, setEditingDetails] = React.useState(false);

  useHeaderTitle("Overview");

  const queue = React.useMemo(
    () => buildAttentionQueue({ board, decisions, experiments, focus: project?.focus, now }),
    [board, decisions, experiments, project?.focus, now]
  );

  if (!board || !project) {
    return (
      <PageColumn>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </PageColumn>
    );
  }

  const engagement = project.projectType === "engagement";
  const [top, ...rest] = queue;

  return (
    <PageColumn>
      <PageHeader
        eyebrow={engagement ? "Overview · Client engagement" : "Overview · Product"}
        title={board.productName}
        description={engagement ? "Where this engagement stands, and what needs you." : "What needs you on this product today."}
        action={
          top ? (
            <LinkButton href={top.href}>{top.actionLabel}</LinkButton>
          ) : (
            <LinkButton href={STAGES.find((s) => s.id === project.focus)?.url ?? "/discover"}>
              Go to the focus stage
            </LinkButton>
          )
        }
        overflow={[
          {
            label: "Project type",
            items: [
              {
                label: "Product",
                checked: !engagement,
                onSelect: () => mutate((draft) => void (draft.projectType = "product")),
              },
              {
                label: "Client engagement",
                checked: engagement,
                onSelect: () => mutate((draft) => void (draft.projectType = "engagement")),
              },
            ],
          },
          {
            items: [
              { label: "Edit name and description", icon: PencilIcon, onSelect: () => setEditingDetails(true) },
              { label: "All projects", href: "/projects" },
            ],
          },
        ]}
      />

      <ProjectDetailsDialog
        open={editingDetails}
        onOpenChange={setEditingDetails}
        name={board.productName}
        description={board.description}
        onSave={({ name, description }) =>
          mutate((draft) => {
            draft.productName = name;
            draft.description = description;
          })
        }
      />

      {top ? <UpNext item={top} /> : <AllClear />}

      {rest.length > 0 && (
        <section>
          <SectionLabel>After that</SectionLabel>
          <RowList>
            {rest.slice(0, 3).map((item) => (
              <Row key={item.id} title={item.title} description={item.detail} href={item.href} />
            ))}
          </RowList>
        </section>
      )}

      <section>
        <SectionLabel>{engagement ? "Stages · client sign-off" : "Stages"}</SectionLabel>
        <RowList>
          {STAGES.map((stage) => {
            const progress = project.progress[stage.id];
            const signoff = board.signoffs?.[stage.id];
            const isFocus = project.focus === stage.id;
            return (
              <Row
                key={stage.id}
                href={stage.url}
                lead={
                  progress.complete ? (
                    <CompletionMark complete size="sm" className="size-5" />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10.5px] text-muted-foreground"
                    >
                      {stage.step}
                    </span>
                  )
                }
                title={stage.name}
                description={stage.question}
                trail={
                  <span className="flex shrink-0 items-center gap-2">
                    {isFocus && <StatusPill tone="info">Focus</StatusPill>}
                    {engagement ? (
                      signoff ? (
                        <StatusPill tone="ok">Signed off</StatusPill>
                      ) : (
                        <StatusPill>Not signed off</StatusPill>
                      )
                    ) : progress.complete ? (
                      <StatusPill tone="ok">Complete</StatusPill>
                    ) : (
                      <>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {progress.met}/{progress.total}
                        </span>
                        <span aria-hidden className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:flex">
                          <span className="bg-foreground" style={{ width: `${(progress.met / progress.total) * 100}%` }} />
                        </span>
                      </>
                    )}
                  </span>
                }
              />
            );
          })}
        </RowList>
      </section>
    </PageColumn>
  );
}

function UpNext({ item }: { item: AttentionItem }) {
  return (
    <section aria-labelledby="up-next">
      <Link
        href={item.href}
        className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs transition-colors hover:bg-muted/40"
      >
        <span
          id="up-next"
          className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
        >
          Up next · {item.kind}
        </span>
        <span className="text-[17px] leading-snug font-semibold text-balance">{item.title}</span>
        {item.body && <span className="line-clamp-3 text-sm leading-relaxed text-foreground/90">{item.body}</span>}
        <span className="text-[13px] text-muted-foreground">{item.detail}</span>
      </Link>
    </section>
  );
}

function AllClear() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        <CheckIcon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Nothing is waiting on you</p>
        <p className="text-sm text-muted-foreground">
          No open decisions, running experiments, high-impact risks or launch tasks. The focus stage shows what
          is still unproven.
        </p>
      </div>
    </div>
  );
}
