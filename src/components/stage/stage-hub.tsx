"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, FlaskConicalIcon, SparklesIcon } from "lucide-react";

import { useAssistant } from "@/components/assistant/assistant-provider";
import { CompletionMark } from "@/components/completion-mark";
import { useHeaderTitle } from "@/components/header-title-context";
import {
  LinkButton,
  MoreDetail,
  NextStep,
  PageColumn,
  PageHeader,
  Row,
  RowList,
  SectionLabel,
} from "@/components/page-header";
import {
  useProjectBoard,
  useProjectExperiments,
  useProjectProgress,
  useProjectStoryMap,
} from "@/components/project-data";
import { ConfidenceDot, ConfidencePill, StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { addHypothesis, createHypothesis } from "@/app/(main)/design/experiments/tasks";
import {
  STAGES,
  answerUrl,
  getStage,
  pageUrl,
  reportUrl,
  type Stage,
  type StageId,
  type StagePage,
} from "@/lib/navigation";
import type { Block, Board } from "@/lib/product-board/schema";
import {
  blockGist,
  blocksFor,
  countConfidence,
  headlineConfidence,
  pageGist,
  placedBlocks,
  pluralise,
} from "@/lib/product-board/view";
import { answerProgress, isAnswered, nextOpenQuestion } from "@/lib/questions";
import type { StageProgress } from "@/lib/stages";
import { cn } from "@/lib/utils";

/**
 * A stage's home page. It answers the stage's question, shows what "done"
 * looks like (measured from the project's own data), and lists the stage's
 * pages and Plays. One primary action per stage.
 *
 * Discover and Define ask questions: the page counts answered questions, its
 * button opens the next open one, and the stage's pages are listed as the
 * sections of its report. The other stages show their evidence checks.
 */
export function StageHub({ stageId }: { stageId: StageId }) {
  const stage = getStage(stageId);
  const { board, mutate } = useProjectBoard();
  const { experiments } = useProjectExperiments();
  const { map, sprints } = useProjectStoryMap();
  const project = useProjectProgress();
  const assistant = useAssistant();
  const [testOpen, setTestOpen] = React.useState(false);
  const [signoffOpen, setSignoffOpen] = React.useState(false);

  useHeaderTitle(stage.name);

  if (!board || !project) {
    return (
      <PageColumn>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </PageColumn>
    );
  }

  const progress = project.progress[stage.id];
  const asks = progress.kind === "questions";
  const engagement = project.projectType === "engagement";
  const signoff = board.signoffs?.[stage.id];
  const stageBlocks = stage.pages.flatMap((p) => blocksFor(board, p.groupIds ?? []));
  const unproven = asks ? progress.assumptions : countConfidence(stageBlocks).assumption;
  const next = STAGES[stage.step]; // step is 1-based, so this is the following stage

  const askAboutStage = () =>
    assistant.open({ scope: stage.name, draft: `What's left before ${stage.name} is done, and what should I do first?` });

  const overflow = [
    { items: [{ label: "Ask about this stage", icon: SparklesIcon, onSelect: askAboutStage }] },
    ...(engagement
      ? [
          {
            label: "Client sign-off",
            items: signoff
              ? [
                  {
                    label: "Clear sign-off",
                    onSelect: () =>
                      mutate((draft) => {
                        if (draft.signoffs) delete draft.signoffs[stage.id];
                      }),
                  },
                ]
              : [{ label: "Record client sign-off", onSelect: () => setSignoffOpen(true) }],
          },
        ]
      : []),
  ];

  return (
    <PageColumn>
      <PageHeader
        eyebrow={`Stage ${stage.step} of ${STAGES.length}${project.focus === stage.id ? " · Focus" : ""}`}
        title={stage.name}
        description={stage.question}
        action={
          asks ? (
            <QuestionAction stage={stage} board={board} progress={progress} />
          ) : (
            <StageAction stage={stage} onTest={() => setTestOpen(true)} />
          )
        }
        overflow={overflow}
      />

      <section aria-labelledby="done-when" className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 id="done-when" className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            {asks ? "Questions answered" : "Done when"}
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {progress.met} of {progress.total}
          </span>
        </div>
        {asks ? (
          <AnsweredSummary progress={progress} />
        ) : (
          <EvidenceChecks progress={progress} />
        )}
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
          {engagement ? (
            <>
              <span>Client sign-off</span>
              {signoff ? (
                <StatusPill tone="ok">
                  Signed off by {signoff.by} · {signoff.on}
                </StatusPill>
              ) : (
                <StatusPill>Not signed off</StatusPill>
              )}
            </>
          ) : (
            <>
              <span>{asks ? "Answers that are still assumptions" : "Still assumptions on this stage’s pages"}</span>
              {unproven > 0 ? <StatusPill tone="warn">{unproven}</StatusPill> : <StatusPill tone="ok">None</StatusPill>}
            </>
          )}
        </div>
      </section>

      {stage.id === "define" && <KeyNumbers board={board} />}

      {asks ? (
        <ReportSections stage={stage} board={board} />
      ) : (
        <StagePages stage={stage} board={board} experiments={experiments} map={map} sprints={sprints} />
      )}

      <MoreDetail label={engagement ? "Plays and deliverables" : "Plays for this stage"} count={stage.plays.length}>
        <p className="px-1.5 pb-2 text-[13px] text-muted-foreground">
          Run a Play with the assistant. It asks what it needs, then proposes updates for this stage.
        </p>
        <RowList>
          {stage.plays.map((play) => (
            <Row
              key={play}
              title={play}
              trail={engagement ? <StatusPill>Deliverable</StatusPill> : undefined}
              onClick={() =>
                assistant.open({
                  scope: stage.name,
                  draft: `Help me run the ${play} play for this project. Ask me what you need, then propose updates.`,
                })
              }
            />
          ))}
        </RowList>
      </MoreDetail>

      {next ? (
        <NextStep eyebrow="Next stage" title={next.name} description={next.question} href={next.url} />
      ) : (
        <NextStep
          eyebrow="Back to the start"
          title="Discover"
          description="What you learn after launch feeds the next round of discovery."
          href="/discover"
        />
      )}

      {stage.id === "design" && <TestAssumptionSheet board={board} open={testOpen} onOpenChange={setTestOpen} />}
      {engagement && (
        <SignoffSheet
          stage={stage}
          open={signoffOpen}
          onOpenChange={setSignoffOpen}
          onSave={(by) =>
            mutate((draft) => {
              draft.signoffs = { ...(draft.signoffs ?? {}), [stage.id]: { by, on: new Date().toISOString().slice(0, 10) } };
            })
          }
        />
      )}
    </PageColumn>
  );
}

/**
 * A question stage's single primary action. Its label follows progress:
 * start, carry on, then read what you've written.
 */
function QuestionAction({ stage, board, progress }: { stage: Stage; board: Board; progress: StageProgress }) {
  const next = nextOpenQuestion(board, stage.id);
  if (!next) return <LinkButton href={reportUrl(stage)}>Read the report</LinkButton>;
  return (
    <LinkButton href={answerUrl(stage, next.id)}>
      {progress.met === 0 ? "Start with the first question" : "Answer the next question"}
    </LinkButton>
  );
}

/** The bar and the check. The check turns green once every question has an answer. */
function AnsweredSummary({ progress }: { progress: StageProgress }) {
  const open = progress.total - progress.met;
  return (
    <>
      <div className="flex items-center gap-3">
        <CompletionMark complete={progress.complete} label={progress.complete ? "Complete" : "Not complete yet"} />
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={progress.complete ? "bg-emerald-600 dark:bg-emerald-500" : "bg-foreground"}
            style={{ width: `${(progress.met / progress.total) * 100}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {progress.complete
          ? "Every question has an answer."
          : `${pluralise(open, "question")} still open. The check turns green when every question has an answer.`}
      </p>
    </>
  );
}

/** A question stage's pages, listed as the sections of its report. */
function ReportSections({ stage, board }: { stage: Stage; board: Board }) {
  return (
    <section>
      <SectionLabel
        aside={
          <Link
            href={reportUrl(stage)}
            className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Read it all
          </Link>
        }
      >
        The {stage.name} report
      </SectionLabel>
      <RowList>
        {stage.pages.map((page) => {
          const section = answerProgress(board, stage.id, page.slug);
          return (
            <Row
              key={page.slug}
              href={pageUrl(stage, page)}
              title={page.title}
              description={`${section.answered} of ${section.total} answered`}
              trail={
                section.complete ? (
                  <CompletionMark complete size="sm" label="All answered" />
                ) : (
                  <StatusPill>{section.total - section.answered} open</StatusPill>
                )
              }
            />
          );
        })}
      </RowList>
    </section>
  );
}

/** An evidence stage's checks, each linking to where the work happens. */
function EvidenceChecks({ progress }: { progress: StageProgress }) {
  return (
    <>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-foreground" style={{ width: `${(progress.met / progress.total) * 100}%` }} />
      </div>
      <ul className="flex flex-col">
        {progress.criteria.map((criterion) => (
          <li key={criterion.label}>
            <Link
              href={criterion.href}
              className="-mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border",
                  criterion.met ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40"
                )}
              >
                {criterion.met && <CheckIcon className="size-3" />}
              </span>
              <span className={cn(criterion.met && "text-muted-foreground")}>{criterion.label}</span>
              <span className="sr-only">{criterion.met ? "(done)" : "(not yet)"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** An evidence stage's pages. */
function StagePages({
  stage,
  board,
  experiments,
  map,
  sprints,
}: {
  stage: Stage;
  board: Board;
  experiments: ReturnType<typeof useProjectExperiments>["experiments"];
  map: ReturnType<typeof useProjectStoryMap>["map"];
  sprints: ReturnType<typeof useProjectStoryMap>["sprints"];
}) {
  return (
    <section>
      <SectionLabel>In this stage</SectionLabel>
      <RowList>
        {stage.pages.map((page) => (
          <Row
            key={page.slug}
            href={pageUrl(stage, page)}
            title={page.title}
            description={<span className="line-clamp-2">{pageSummary(stage, page, board, experiments, map, sprints)}</span>}
            trail={pageTrail(page, board)}
          />
        ))}
      </RowList>
    </section>
  );
}

/** Each evidence stage's single primary action. Question stages use `QuestionAction`. */
function StageAction({ stage, onTest }: { stage: Stage; onTest: () => void }) {
  switch (stage.id) {
    case "discover":
    case "define":
      return null;
    case "design":
      return (
        <Button onClick={onTest}>
          <FlaskConicalIcon />
          Test an assumption
        </Button>
      );
    case "develop":
      return <LinkButton href="/develop/story-map">Open the story map</LinkButton>;
    case "deploy":
      return <LinkButton href="/deploy/launch">Finish the launch checklist</LinkButton>;
  }
}

function pageSummary(
  stage: Stage,
  page: StagePage,
  board: Board,
  experiments: ReturnType<typeof useProjectExperiments>["experiments"],
  map: ReturnType<typeof useProjectStoryMap>["map"],
  sprints: ReturnType<typeof useProjectStoryMap>["sprints"]
): string {
  if (page.groupIds?.length) return pageGist(board, page);
  const key = `${stage.id}/${page.slug}`;
  if (key === "design/experiments") {
    const running = experiments.flatMap((h) => h.experiments).filter((e) => e.status === "running").length;
    return `${pluralise(experiments.length, "hypothesis", "hypotheses")} · ${running} running`;
  }
  if (key === "develop/story-map") {
    const stories = Object.values(map.storiesByCell).reduce((n, list) => n + list.length, 0);
    return `${pluralise(stories, "story", "stories")} across ${pluralise(sprints.length, "sprint")} and the backlog`;
  }
  if (key === "deploy/metrics") return "Targets against actuals. Not connected to a data source yet.";
  return page.question;
}

function pageTrail(page: StagePage, board: Board) {
  if (!page.groupIds?.length) return undefined;
  const open = countConfidence(blocksFor(board, page.groupIds)).assumption;
  return open > 0 ? <StatusPill tone="warn">{pluralise(open, "assumption")}</StatusPill> : <StatusPill tone="ok">Proven</StatusPill>;
}

function KeyNumbers({ board }: { board: Board }) {
  // A new project's key numbers are blank until the answers behind them exist.
  const items = board.headline
    .filter((item) => item.value.trim())
    .map((item) => ({ ...item, confidence: headlineConfidence(board, item.id) }));
  if (items.length === 0) return null;
  const unproven = items.filter((i) => i.confidence === "assumption").length;
  return (
    <section>
      <SectionLabel>Key numbers</SectionLabel>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))] gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-start gap-1 rounded-lg bg-muted/50 p-3">
            <dt className="text-xs leading-tight text-muted-foreground">{item.label}</dt>
            <dd className="text-lg font-semibold tracking-tight tabular-nums">{item.value}</dd>
            {item.confidence && <ConfidenceDot confidence={item.confidence} />}
          </div>
        ))}
      </dl>
      {unproven > 0 && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {unproven === items.length ? "All of these rest on assumptions." : `${unproven} of ${items.length} rest on assumptions.`}
        </p>
      )}
    </section>
  );
}

/** Design's primary action: turn a board assumption into a hypothesis. */
function TestAssumptionSheet({
  board,
  open,
  onOpenChange,
}: {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setExperiments } = useProjectExperiments();
  // Only answers can be tested; an unanswered block has nothing to test yet.
  const assumptions = placedBlocks(board).filter(
    ({ block }) => block.confidence === "assumption" && isAnswered(block)
  );

  const test = (block: Block) => {
    const hypothesis = createHypothesis({
      title: `Test: ${block.title}`,
      belief: blockGist(block),
      testsBlockId: block.id,
    });
    setExperiments((prev) => addHypothesis(prev, hypothesis));
    onOpenChange(false);
    router.push(`/design/experiments?open=${encodeURIComponent(hypothesis.id)}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Test an assumption</SheetTitle>
          <SheetDescription>
            Pick one. It becomes a hypothesis in Experiments, ready for its first experiment.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {assumptions.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Nothing on the board is still an assumption.</p>
          ) : (
            <RowList>
              {assumptions.map(({ block, stage, page }) => (
                <Row
                  key={block.id}
                  onClick={() => test(block)}
                  lead={<FlaskConicalIcon className="size-4 shrink-0 text-muted-foreground" />}
                  title={block.title}
                  description={`${stage.name} › ${page.title}`}
                  trail={<ConfidencePill confidence="assumption" />}
                />
              ))}
            </RowList>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Records who on the client side signed off a stage, for client engagements. */
function SignoffSheet({
  stage,
  open,
  onOpenChange,
  onSave,
}: {
  stage: Stage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (by: string) => void;
}) {
  const [name, setName] = React.useState("");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>Record client sign-off</SheetTitle>
          <SheetDescription>Marks {stage.name} as accepted by the client. You can clear it later.</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onSave(name.trim());
            setName("");
            onOpenChange(false);
          }}
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            <Label htmlFor="signoff-name">Who signed off?</Label>
            <Input id="signoff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name and role" />
          </div>
          <SheetFooter className="mt-auto border-t">
            <Button type="submit" disabled={!name.trim()}>
              Record sign-off
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
