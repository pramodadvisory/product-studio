"use client";

import Link from "next/link";

import { useHeaderTitle } from "@/components/header-title-context";
import { NextStep, PageColumn, PageHeader, SectionLabel } from "@/components/page-header";
import { useProjectBoard } from "@/components/project-data";
import { StatusPill } from "@/components/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { getStagePage, stageEyebrow } from "@/lib/navigation";
import { BLOCK_IDS, findBlock } from "@/lib/product-board/view";

/**
 * Deploy › Metrics — are we hitting the targets we set?
 *
 * Targets are set in Define › Success targets and only read here, so there is
 * one place to change them. Actual values need a data source, which can't be
 * connected yet; once it can, "Connect a data source" becomes this page's
 * one action.
 */
export default function MetricsPage() {
  const { stage, page } = getStagePage("deploy", "metrics");
  const { board } = useProjectBoard();

  useHeaderTitle(`${stage.name} › ${page.title}`);

  if (!board) {
    return (
      <PageColumn>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </PageColumn>
    );
  }

  const kpis = findBlock(board, BLOCK_IDS.kpis);
  const targets = kpis?.type === "metrics" ? kpis.items : [];

  return (
    <PageColumn>
      <PageHeader
        back={{ label: stage.name, href: stage.url }}
        eyebrow={stageEyebrow(stage)}
        title={page.title}
        description={page.question}
        hint={
          <>
            Actual values appear here once a data source is connected. Targets are set in{" "}
            <Link href="/define/targets" className="underline underline-offset-2 hover:text-foreground">
              Define › Success targets
            </Link>
            .
          </>
        }
      />

      <section>
        <SectionLabel>Targets</SectionLabel>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No targets yet. Set them in{" "}
            <Link href="/define/targets" className="underline underline-offset-2">
              Define › Success targets
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-y text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-1.5 py-2 font-medium">Metric</th>
                  <th scope="col" className="px-1.5 py-2 font-medium">Target</th>
                  <th scope="col" className="px-1.5 py-2 text-right font-medium">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t">
                {targets.map((item) => (
                  <tr key={item.id}>
                    <td className="px-1.5 py-3 font-medium">{item.label}</td>
                    <td className="px-1.5 py-3 tabular-nums">{item.value}</td>
                    <td className="px-1.5 py-3 text-right">
                      <StatusPill>Not tracked</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NextStep
        eyebrow="Back to the start"
        title="Discover"
        description="What you learn after launch feeds the next round of discovery."
        href="/discover"
      />
    </PageColumn>
  );
}
