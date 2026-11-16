"use client";

import * as React from "react";
import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import { useAssistant } from "@/components/assistant/assistant-provider";
import { useHeaderTitle } from "@/components/header-title-context";
import { LinkButton, MoreDetail, NextStep, PageColumn, PageHeader } from "@/components/page-header";
import { BlockRenderer } from "@/components/product-board/blocks";
import { useProjectBoard } from "@/components/project-data";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGES, answerUrl, getStage, stageEyebrow, type Stage, type StageId, type StagePage } from "@/lib/navigation";
import type { Block, Board } from "@/lib/product-board/schema";
import { blocksFor, pluralise } from "@/lib/product-board/view";
import { answerProgress, nextOpenQuestion, questionStatuses, type Question } from "@/lib/questions";

/**
 * A stage's report: every answer in the stage as one document, read top to
 * bottom. Its sections are the stage's pages, and the sidebar links under the
 * stage jump to them (#customers, #market…).
 *
 * Answers edit in place, using the same block editors as everywhere else;
 * they are the same blocks the question flow writes to. A question with no
 * answer yet shows where it belongs, with a link into the question flow.
 */
export function StageReport({ stageId }: { stageId: StageId }) {
  const stage = getStage(stageId);
  const { board, mutateBlock } = useProjectBoard();
  const assistant = useAssistant();
  const loaded = Boolean(board);

  useHeaderTitle(`${stage.name} › Report`);

  // A direct link to a section arrives before the board has loaded, so the
  // browser can't scroll to it yet. Scroll once the sections exist.
  React.useEffect(() => {
    if (!loaded) return;
    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [loaded]);

  if (!board) {
    return (
      <PageColumn>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </PageColumn>
    );
  }

  const progress = answerProgress(board, stage.id);
  const open = progress.total - progress.answered;
  const next = nextOpenQuestion(board, stage.id);
  const nextStage = STAGES[stage.step]; // step is 1-based, so this is the following stage

  const actionLabel =
    progress.answered === 0
      ? "Start with the first question"
      : open === 1
        ? "Answer the last open question"
        : `Answer the ${open} open questions`;

  return (
    <PageColumn>
      <PageHeader
        back={{ label: stage.name, href: stage.url }}
        eyebrow={`Report · ${stageEyebrow(stage)}`}
        title={`${stage.name} report`}
        description={stage.question}
        action={next ? <LinkButton href={answerUrl(stage, next.id)}>{actionLabel}</LinkButton> : undefined}
        overflow={[
          {
            items: [
              {
                label: "Ask about this report",
                icon: SparklesIcon,
                onSelect: () =>
                  assistant.open({
                    scope: stage.name,
                    draft: `Read the ${stage.name} report. Which answers are weakest, and how would you strengthen them?`,
                  }),
              },
            ],
          },
        ]}
      />

      <div className="-mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-y py-2.5 text-[13px] text-muted-foreground">
        <span className="tabular-nums">
          {progress.answered} of {progress.total} answered
        </span>
        {progress.complete ? <StatusPill tone="ok">Complete</StatusPill> : null}
        {progress.assumptions > 0 && (
          <StatusPill tone="warn">{pluralise(progress.assumptions, "assumption")}</StatusPill>
        )}
        <span className="ml-auto">Click any answer to edit it.</span>
      </div>

      {stage.pages.map((page) => (
        <ReportSection key={page.slug} stage={stage} page={page} board={board} mutateBlock={mutateBlock} />
      ))}

      {nextStage && (
        <NextStep eyebrow="Next stage" title={nextStage.name} description={nextStage.question} href={nextStage.url} />
      )}
    </PageColumn>
  );
}

function ReportSection({
  stage,
  page,
  board,
  mutateBlock,
}: {
  stage: Stage;
  page: StagePage;
  board: Board;
  mutateBlock: (blockId: string, recipe: (block: Block) => void) => void;
}) {
  const statuses = questionStatuses(board, stage.id, page.slug);
  const progress = answerProgress(board, stage.id, page.slug);
  const asked = new Set(statuses.map((s) => s.question.blockId));
  // Blocks no question asks for, such as charts drawn from the answers.
  const optional = blocksFor(board, page.groupIds ?? []).filter((b) => !asked.has(b.id));

  return (
    <section id={page.slug} aria-labelledby={`${page.slug}-title`} className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 border-b pb-2">
        <h2 id={`${page.slug}-title`} className="text-lg font-semibold tracking-tight text-balance">
          {page.title}
        </h2>
        {progress.complete ? (
          <StatusPill tone="ok">Complete</StatusPill>
        ) : (
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {progress.answered} of {progress.total}
          </span>
        )}
      </div>

      {statuses.map(({ question, block, answered }) =>
        answered && block ? (
          <BlockRenderer key={block.id} block={asDocument(block)} mutateBlock={mutateBlock} />
        ) : (
          <OpenQuestion key={question.id} stage={stage} question={question} title={block?.title} />
        )
      )}

      {optional.length > 0 && (
        <MoreDetail label="Optional detail" count={optional.length}>
          <div className="flex flex-col gap-4 pt-2">
            {optional.map((block) => (
              <BlockRenderer key={block.id} block={asDocument(block)} mutateBlock={mutateBlock} />
            ))}
          </div>
        </MoreDetail>
      )}
    </section>
  );
}

function OpenQuestion({ stage, question, title }: { stage: Stage; question: Question; title?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && (
          <span className="text-[13px] font-semibold tracking-[0.06em] text-foreground/65 uppercase">{title}</span>
        )}
        <span className="text-sm leading-snug">{question.prompt}</span>
        <span className="text-[13px] text-muted-foreground">Not answered yet</span>
      </div>
      <Button variant="outline" nativeButton={false} render={<Link href={answerUrl(stage, question.id)} />}>
        Answer
      </Button>
    </div>
  );
}

/**
 * Reports read as a document: every block in the same quiet box, numbers
 * laid out across the width, lists in one column. Display only; edits go to
 * the real block by id.
 */
function asDocument(block: Block): Block {
  return { ...block, emphasis: "plain", size: block.type === "metrics" ? "full" : "half" };
}
