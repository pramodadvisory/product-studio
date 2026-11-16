/**
 * A published project, as its readers see it: one page, read top to bottom.
 *
 *   Summary          headline numbers, where each stage stands, what changed
 *   How to read this what the confidence chips mean
 *   Sections         every answered page, grouped by stage
 *
 * Readers are stakeholders who arrive from a link and don't know the app, so
 * sections are headed by the question they answer ("What could go wrong?"),
 * with the PM's section name above it. Nothing here edits: blocks render
 * without a save function, which makes them read-only.
 *
 * A server component. The contents rail and the blocks are client components.
 */
import { BlockRenderer } from "@/components/product-board/blocks";
import { MoreDetail, Row, RowList, SectionLabel } from "@/components/page-header";
import { SectionLink } from "@/components/section-link";
import { ConfidenceDot, ConfidencePill, StatusPill } from "@/components/status-pill";
import { STAGES, stageEyebrow } from "@/lib/navigation";
import type { Confidence } from "@/lib/product-board/schema";
import { asDocument, headlineConfidence } from "@/lib/product-board/view";
import { describeChanges } from "@/lib/publishing/changes";
import { publishedContent, stageStanding, type PublishedStage } from "@/lib/publishing/content";
import type { PublishedProject } from "@/lib/publishing/types";
import { ContentsRail, JumpBar, type NavGroup } from "./published-nav";

/** Dates are formatted on the server, in UTC, so every reader sees the same one. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso)
  );
}

export function PublishedView({ project }: { project: PublishedProject }) {
  const board = project.doc;
  const content = publishedContent(board);

  const groups: NavGroup[] = [
    { items: [{ id: "summary", label: "Summary" }] },
    ...content.map(({ stage, sections }) => ({
      label: stage.name,
      items: sections.map(({ page }) => ({ id: page.slug, label: page.readerQuestion, hint: page.title })),
    })),
  ];

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <JumpBar productName={board.productName} groups={groups} />
      <div className="mx-auto flex w-full max-w-5xl gap-12 px-4 lg:px-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <ContentsRail productName={board.productName} version={project.version} groups={groups} />
        </aside>
        <main className="flex min-w-0 max-w-2xl flex-1 flex-col gap-16 py-8 lg:py-14">
          <Summary project={project} content={content} />
          {content.map((stage) => (
            <StageSections key={stage.stage.id} stage={stage} />
          ))}
          <footer className="flex flex-col gap-1 border-t pt-6 text-[13px] text-muted-foreground">
            <p>
              A read-only copy, published {formatDate(project.publishedAt)} as version {project.version}. It changes
              only when the team publishes again.
            </p>
            <p>Made with Product Studio</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Summary({ project, content }: { project: PublishedProject; content: PublishedStage[] }) {
  const board = project.doc;
  const headline = board.headline.filter((h) => h.value.trim());
  const firstSection = new Map(content.map((s) => [s.stage.id, s.sections[0]?.page.slug]));

  return (
    <section id="summary" aria-labelledby="summary-title" className="flex scroll-mt-20 flex-col gap-10">
      <header className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {board.projectType === "engagement" ? "Client engagement" : "Product"} · Published v{project.version} ·{" "}
          {formatDate(project.publishedAt)}
        </p>
        <h1 id="summary-title" className="text-3xl font-semibold tracking-tight text-balance">
          {board.productName}
        </h1>
        {board.description && (
          <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{board.description}</p>
        )}
      </header>

      {headline.length > 0 && (
        <section aria-label="Headline numbers">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {headline.map((h) => {
              const confidence = headlineConfidence(board, h.id);
              return (
                <div key={h.id} className="flex flex-col gap-1 rounded-xl border p-4">
                  <dt className="text-[13px] text-muted-foreground">{h.label}</dt>
                  <dd className="text-xl font-semibold tracking-tight tabular-nums">{h.value}</dd>
                  {confidence && (
                    <dd>
                      <ConfidenceDot confidence={confidence} />
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </section>
      )}

      <section aria-labelledby="standing">
        <SectionLabel>
          <span id="standing">Where it stands</span>
        </SectionLabel>
        <RowList>
          {STAGES.map((stage) => {
            const standing = stageStanding(board, stage);
            const target = firstSection.get(stage.id);
            return (
              <Row
                key={stage.id}
                href={target ? `#${target}` : undefined}
                lead={
                  <span
                    aria-hidden
                    className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10.5px] text-muted-foreground"
                  >
                    {stage.step}
                  </span>
                }
                title={stage.name}
                description={standing.detail ? `${stage.question} Signed off ${standing.detail}.` : stage.question}
                trail={<StatusPill tone={standing.tone}>{standing.label}</StatusPill>}
              />
            );
          })}
        </RowList>
      </section>

      <WhatChanged project={project} content={content} />
      <HowToRead />
    </section>
  );
}

function WhatChanged({ project, content }: { project: PublishedProject; content: PublishedStage[] }) {
  const { note, previous } = project;
  if (!previous && !note) return null;

  const changes = previous ? describeChanges(previous.doc, project.doc) : null;
  const onPage = new Set(content.flatMap((s) => s.sections.map((sec) => sec.page.slug)));
  const nothing = changes && changes.headline.length === 0 && changes.sections.length === 0;

  return (
    <section aria-labelledby="what-changed">
      <SectionLabel>
        <span id="what-changed">
          {previous ? `What changed since v${previous.version} · ${formatDate(previous.publishedAt)}` : "A note from the team"}
        </span>
      </SectionLabel>
      <div className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4">
        {note && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{note}</p>}

        {changes && changes.headline.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Headline numbers</p>
            <ChangeLines lines={changes.headline} />
          </div>
        )}

        {changes?.sections.map((section) => (
          <div key={section.slug} className="flex flex-col gap-1">
            {onPage.has(section.slug) ? (
              <SectionLink href={`#${section.slug}`} className="w-fit text-sm font-medium underline-offset-4 hover:underline">
                {section.title}
              </SectionLink>
            ) : (
              <p className="text-sm font-medium">{section.title}</p>
            )}
            <ChangeLines lines={section.lines} />
          </div>
        ))}

        {nothing && <p className="text-sm text-muted-foreground">No changes to the content since v{previous!.version}.</p>}
      </div>
    </section>
  );
}

function ChangeLines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-muted-foreground/50" />
          {line}
        </li>
      ))}
    </ul>
  );
}

const CONFIDENCE_MEANING: { confidence: Confidence; meaning: string }[] = [
  { confidence: "assumption", meaning: "The team's best current thinking. Not yet tested, so it may change." },
  { confidence: "validated", meaning: "Backed by evidence: research, data or an experiment." },
  { confidence: "decided", meaning: "Agreed and committed to." },
];

function HowToRead() {
  return (
    <section id="how-to-read" aria-labelledby="how-to-read-title" className="scroll-mt-20">
      <SectionLabel>
        <span id="how-to-read-title">How to read this</span>
      </SectionLabel>
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Each answer is marked with how sure the team is of it. Questions the team hasn&apos;t answered yet are
          left out.
        </p>
        <dl className="flex flex-col gap-2">
          {CONFIDENCE_MEANING.map(({ confidence, meaning }) => (
            <div key={confidence} className="flex items-baseline gap-3">
              <dt className="w-24 shrink-0">
                <ConfidencePill confidence={confidence} />
              </dt>
              <dd className="leading-snug">{meaning}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function StageSections({ stage: { stage, sections } }: { stage: PublishedStage }) {
  return (
    <div className="flex flex-col gap-16">
      {sections.map(({ page, blocks, optional }) => (
        <section
          key={page.slug}
          id={page.slug}
          aria-labelledby={`${page.slug}-title`}
          className="flex scroll-mt-20 flex-col gap-4"
        >
          <header className="flex flex-col gap-1 border-b pb-3">
            <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {stageEyebrow(stage)} · {page.title}
            </p>
            <h2 id={`${page.slug}-title`} className="text-xl font-semibold tracking-tight text-balance">
              {page.readerQuestion}
            </h2>
          </header>

          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={asDocument(block)} />
          ))}

          {optional.length > 0 && (
            <MoreDetail label="More detail" count={optional.length} defaultOpen={blocks.length === 0}>
              <div className="flex flex-col gap-4 pt-2">
                {optional.map((block) => (
                  <BlockRenderer key={block.id} block={asDocument(block)} />
                ))}
              </div>
            </MoreDetail>
          )}
        </section>
      ))}
    </div>
  );
}
