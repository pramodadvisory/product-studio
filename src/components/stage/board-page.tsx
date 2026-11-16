"use client";

import * as React from "react";

import { useHeaderTitle } from "@/components/header-title-context";
import { MoreDetail, NextStep, PageColumn, PageHeader } from "@/components/page-header";
import { BlockRenderer } from "@/components/product-board/blocks";
import { useProjectBoard } from "@/components/project-data";
import { Skeleton } from "@/components/ui/skeleton";
import { getStagePage, pageUrl, stageEyebrow, type StageId } from "@/lib/navigation";
import type { Block } from "@/lib/product-board/schema";
import { blocksFor } from "@/lib/product-board/view";

/**
 * A stage page built from Product Board content, e.g. Discover › Customers &
 * pain points. Headline blocks first, supporting detail folded under "More
 * detail", then a link on. Nothing to create here, so no primary button:
 * every block edits in place.
 */
export function BoardPage({
  stageId,
  slug,
  hint = "Click any text to edit it.",
}: {
  stageId: StageId;
  slug: string;
  hint?: string;
}) {
  const { stage, page } = getStagePage(stageId, slug);
  const { board, mutateBlock } = useProjectBoard();
  const [showAll, setShowAll] = React.useState(false);

  useHeaderTitle(`${stage.name} › ${page.title}`);

  if (!board) {
    return (
      <PageColumn>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </PageColumn>
    );
  }

  const blocks = blocksFor(board, page.groupIds ?? []);
  const headline = blocks.filter((b) => b.inSummary);
  const lead = headline.length > 0 ? headline : blocks.slice(0, 1);
  const detail = blocks.filter((b) => !lead.includes(b));

  const index = stage.pages.findIndex((p) => p.slug === page.slug);
  const next = stage.pages[index + 1];

  return (
    <PageColumn>
      <PageHeader
        back={{ label: stage.name, href: stage.url }}
        eyebrow={stageEyebrow(stage)}
        title={page.title}
        description={page.question}
        hint={hint}
        overflow={
          detail.length > 0
            ? [{ items: [{ label: "Show all detail", checked: showAll, onSelect: () => setShowAll((v) => !v) }] }]
            : undefined
        }
      />

      <div className="flex flex-col gap-4">
        {lead.map((block, i) => (
          <BlockRenderer key={block.id} block={oneHero(block, i)} mutateBlock={mutateBlock} />
        ))}
      </div>

      {detail.length > 0 && (
        // Remount when "Show all detail" flips so the fold follows it.
        <MoreDetail key={String(showAll)} label="More detail" count={detail.length} defaultOpen={showAll}>
          <div className="flex flex-col gap-4 pt-2">
            {detail.map((block) => (
              <BlockRenderer key={block.id} block={oneHero(block, 1)} mutateBlock={mutateBlock} />
            ))}
          </div>
        </MoreDetail>
      )}

      {next ? (
        <NextStep eyebrow={`Next in ${stage.name}`} title={next.title} description={next.question} href={pageUrl(stage, next)} />
      ) : (
        <NextStep eyebrow="Back to" title={stage.name} description="See what's left before this stage is done." href={stage.url} />
      )}
    </PageColumn>
  );
}

/**
 * One emphasised block per page: only the first block keeps the dark "hero"
 * treatment. Display-only; edits still go to the real block by id.
 */
function oneHero(block: Block, index: number): Block {
  if (index === 0 || block.emphasis !== "hero") return block;
  return { ...block, emphasis: "card" };
}
