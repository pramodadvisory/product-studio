"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronRightIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useAssistant } from "@/components/assistant/assistant-provider";
import { CompletionMark } from "@/components/completion-mark";
import { useHeaderTitle } from "@/components/header-title-context";
import { LinkButton, NextStep } from "@/components/page-header";
import { useProjectBoard } from "@/components/project-data";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  STAGES,
  answerUrl,
  getStage,
  reportUrl,
  type Stage,
  type StageId,
} from "@/lib/navigation";
import {
  newId,
  type Block,
  type Confidence,
  type ListBlock,
  type MetricsBlock,
  type RecordsBlock,
  type StatementBlock,
} from "@/lib/product-board/schema";
import { pluralise } from "@/lib/product-board/view";
import {
  EXAMPLE_PRODUCT,
  answerProgress,
  getQuestion,
  isAnswered,
  nextOpenQuestion,
  questionStatuses,
  type Question,
  type QuestionStatus,
} from "@/lib/questions";
import { cn } from "@/lib/utils";

/**
 * Answering a stage's questions, one per screen.
 *
 * Full screen over the sidebar, so there is one thing to do: read why the
 * question matters, write the answer, say how you know it, then Save and
 * next. Answers are written to the same board blocks the stage report shows,
 * so anything answered here can be edited there later, and the other way round.
 *
 * With no question in the URL it opens the first open question; when none are
 * left it shows the stage as complete.
 */
export function QuestionFlow({
  stageId,
  questionId,
}: {
  stageId: StageId;
  questionId?: string;
}) {
  const stage = getStage(stageId);
  const { board } = useProjectBoard();
  useHeaderTitle(`${stage.name} › Questions`);

  if (!board) {
    return (
      <FlowFrame stage={stage}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </FlowFrame>
    );
  }

  const statuses = questionStatuses(board, stageId);
  const requested = getQuestion(questionId);
  const question =
    requested?.stageId === stageId
      ? requested
      : nextOpenQuestion(board, stageId);

  if (!question) {
    return (
      <FlowFrame stage={stage} statuses={statuses}>
        <StageComplete
          stage={stage}
          assumptions={answerProgress(board, stageId).assumptions}
        />
      </FlowFrame>
    );
  }

  const index = statuses.findIndex((s) => s.question.id === question.id);
  // Keyed by question so each one starts from its own saved answer.
  return (
    <QuestionStep
      key={question.id}
      stage={stage}
      statuses={statuses}
      index={index}
    />
  );
}

// ─────────────────────────────────────────────────────────────── frame

function FlowFrame({
  stage,
  statuses,
  index,
  onClose,
  footer,
  wide,
  children,
}: {
  stage: Stage;
  statuses?: QuestionStatus[];
  index?: number;
  /** Runs before leaving, e.g. to save what was typed. */
  onClose?: () => void;
  footer?: React.ReactNode;
  /** Room for a side column on wide screens. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const width = wide ? "max-w-xl lg:max-w-5xl" : "max-w-xl";
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3 sm:gap-4 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={stage.url} onClick={onClose} />}
          aria-label={`Save and go back to ${stage.name}`}
        >
          <XIcon />
        </Button>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {stage.name}
          {statuses && index !== undefined && index >= 0
            ? ` · ${index + 1} of ${statuses.length}`
            : ""}
        </span>
        {statuses && (
          <ProgressSegments
            stage={stage}
            statuses={statuses}
            index={index}
            onLeave={onClose}
          />
        )}
      </header>
      <main className="flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-8 px-4 py-8 sm:py-10",
            width,
          )}
        >
          {children}
        </div>
      </main>
      {footer && (
        <footer className="shrink-0 border-t bg-background">
          <div
            className={cn(
              "mx-auto flex w-full flex-wrap items-center gap-2 px-4 py-3",
              width,
            )}
          >
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

/** One segment per question: filled when answered, outlined when it's the current one. Each jumps to its question. */
function ProgressSegments({
  stage,
  statuses,
  index,
  onLeave,
}: {
  stage: Stage;
  statuses: QuestionStatus[];
  index?: number;
  onLeave?: () => void;
}) {
  return (
    <nav
      aria-label="Questions"
      className="flex min-w-0 flex-1 items-center gap-0.5"
    >
      {statuses.map((status, i) => (
        <Link
          key={status.question.id}
          href={answerUrl(stage, status.question.id)}
          onClick={onLeave}
          aria-label={`Question ${i + 1}: ${status.question.prompt} (${status.answered ? "answered" : "open"})`}
          aria-current={i === index ? "step" : undefined}
          className="group flex flex-1 items-center py-2"
        >
          <span
            className={cn(
              "h-1.5 w-full rounded-full transition-colors",
              i === index
                ? "bg-transparent ring-[1.5px] ring-foreground ring-inset"
                : status.answered
                  ? "bg-foreground group-hover:bg-foreground/80"
                  : "bg-muted group-hover:bg-muted-foreground/30",
            )}
          />
        </Link>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────── one question

const CONFIDENCE_OPTIONS: {
  value: Confidence;
  title: string;
  detail: string;
}[] = [
  {
    value: "assumption",
    title: "A best guess",
    detail:
      "Nobody has checked it yet. It's marked as an Assumption until it's tested.",
  },
  {
    value: "validated",
    title: "We've tested it",
    detail: "Customers, data or an experiment back it up. Marked Validated.",
  },
  {
    value: "decided",
    title: "We've agreed it",
    detail: "The team or the client has formally agreed it. Marked Decided.",
  },
];

function QuestionStep({
  stage,
  statuses,
  index,
}: {
  stage: Stage;
  statuses: QuestionStatus[];
  index: number;
}) {
  const router = useRouter();
  const assistant = useAssistant();
  const { board, mutateBlock } = useProjectBoard();
  const { question, block } = statuses[index];
  const page = stage.pages.find((p) => p.slug === question.section);

  // Until the person edits, the draft follows the saved block, so an answer
  // the assistant applies shows up here straight away.
  const [edited, setEdited] = React.useState<Block | null>(null);
  const [picked, setPicked] = React.useState<Confidence | null>(null);
  const draft = edited ?? (block ? toDraft(block) : undefined);
  const confidence = picked ?? block?.confidence ?? "assumption";
  const answer = draft ? clean(draft) : undefined;
  const canSave = isAnswered(answer);
  const changed = edited !== null || picked !== null;

  // On a wide screen, put the cursor in an empty answer so typing can start
  // straight away. Not on a phone: the keyboard would cover the guidance,
  // which a first-timer needs to read first.
  const editorRef = React.useRef<HTMLDivElement>(null);
  const startsEmpty = React.useRef(!statuses[index].answered);
  React.useEffect(() => {
    if (
      !startsEmpty.current ||
      !window.matchMedia("(min-width: 768px)").matches
    )
      return;
    editorRef.current
      ?.querySelector<HTMLElement>("input, textarea")
      ?.focus({ preventScroll: true });
  }, []);

  const commit = () => {
    if (!block || !answer || !canSave) return false;
    mutateBlock(block.id, (target) => {
      applyAnswer(target, answer);
      target.confidence = confidence;
    });
    return true;
  };

  const saveIfChanged = () => {
    if (changed) commit();
  };

  const goNext = () => {
    if (!board) return;
    const next = nextOpenQuestion(board, stage.id, question.id);
    router.push(answerUrl(stage, next?.id));
  };

  const saveAndNext = () => {
    if (commit()) goNext();
  };

  const skip = () => {
    if (!board) return;
    const next = nextOpenQuestion(board, stage.id, question.id);
    if (next) router.push(answerUrl(stage, next.id));
    else if (statuses[index].answered) router.push(answerUrl(stage));
    else toast("This is the only open question left.");
  };

  const back = () => {
    saveIfChanged();
    router.push(answerUrl(stage, statuses[index - 1].question.id));
  };

  const helpMeAnswer = () =>
    assistant.open({
      scope: page ? `${stage.name} › ${page.title}` : stage.name,
      draft: `Help me answer "${question.prompt}" for this project. Ask me what you need to know first, then propose an answer for the ${block?.title ?? "matching"} block.`,
    });

  // ⌘↩ / Ctrl+↩ saves and moves on from anywhere on the screen.
  const saveRef = React.useRef(saveAndNext);
  React.useEffect(() => {
    saveRef.current = saveAndNext;
  });
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={helpMeAnswer}
        aria-label="Help me answer"
      >
        <SparklesIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Help me answer</span>
      </Button>
      <span className="flex-1" />
      <Button variant="ghost" onClick={back} disabled={index === 0}>
        Back
      </Button>
      <Button variant="ghost" onClick={skip}>
        Skip
      </Button>
      <Button
        onClick={saveAndNext}
        disabled={!canSave}
        aria-describedby={canSave ? undefined : "save-hint"}
      >
        Save and next
      </Button>
      {!canSave && draft && (
        <p
          id="save-hint"
          className="basis-full text-right text-[13px] text-muted-foreground"
        >
          {requirement(draft)}
        </p>
      )}
    </>
  );

  return (
    <FlowFrame
      stage={stage}
      statuses={statuses}
      index={index}
      onClose={saveIfChanged}
      footer={footer}
      wide
    >
      {/*
        One column on a phone, with the guidance between the question and the
        answer. On a wide screen the question, answer and confidence stay in a
        narrow left column and the guidance sits beside them, pinned while the
        answer scrolls. The last row takes any extra height, so a tall guidance
        card doesn't open gaps between the left-hand sections.
      */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12">
        <div className="flex flex-col gap-3 lg:col-start-1">
          <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            {page?.title ?? stage.name}
          </p>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-[28px]">
            {question.prompt}
          </h1>
        </div>

        <div className="lg:sticky lg:top-8 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start">
          <Guidance question={question} />
        </div>

        <section
          aria-labelledby="your-answer"
          className="flex flex-col gap-3 lg:col-start-1"
        >
          <h2
            id="your-answer"
            className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
          >
            Your answer
          </h2>
          {draft ? (
            <div ref={editorRef}>
              <AnswerEditor
                block={draft}
                label={question.prompt}
                onChange={setEdited}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This project has no place for this answer yet.
            </p>
          )}
        </section>

        <fieldset className="flex flex-col gap-3 lg:col-start-1 lg:self-start">
          <legend className="mb-3 font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            How do you know this?
          </legend>
          <div className="flex flex-col gap-2">
            {CONFIDENCE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors hover:bg-muted/50",
                  confidence === option.value && "border-foreground",
                )}
              >
                <input
                  type="radio"
                  name="confidence"
                  value={option.value}
                  checked={confidence === option.value}
                  onChange={() => setPicked(option.value)}
                  className="mt-1 accent-foreground"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.title}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {option.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </FlowFrame>
  );
}

/** Why it matters, what a good answer contains, and a worked example, folded. */
function Guidance({ question }: { question: Question }) {
  return (
    <section
      aria-label="Guidance"
      className="flex flex-col gap-5 rounded-xl border bg-muted/40 p-5"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Why this matters
        </h2>
        <p className="text-[15px] leading-relaxed">{question.why}</p>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          A good answer
        </h2>
        <ul className="flex flex-col gap-2">
          {question.good.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-relaxed"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <CheckIcon className="size-2.5" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <Collapsible className="border-t pt-4">
        <CollapsibleTrigger className="group/example flex cursor-pointer items-center gap-1.5 text-sm font-medium">
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[panel-open]/example:rotate-90 motion-reduce:transition-none" />
          See an example
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="mt-3 flex flex-col gap-2 border-l-2 pl-4">
            <p className="text-[13px] text-muted-foreground">
              From an example product: {EXAMPLE_PRODUCT}.
            </p>
            {Array.isArray(question.example) ? (
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed marker:text-muted-foreground">
                {question.example.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed">{question.example}</p>
            )}
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </section>
  );
}

function StageComplete({
  stage,
  assumptions,
}: {
  stage: Stage;
  assumptions: number;
}) {
  const next = STAGES[stage.step]; // step is 1-based, so this is the following stage
  return (
    <>
      <div className="flex flex-col items-start gap-3 pt-4">
        <CompletionMark complete size="lg" />
        <p className="mt-2 font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Stage {stage.step} of {STAGES.length} · Complete
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
          {stage.name} is answered
        </h1>
        <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          Every question has an answer.
          {assumptions > 0 &&
            ` ${pluralise(assumptions, "answer is still an assumption", "answers are still assumptions")}. Testing them is what Design is for.`}
        </p>
        <LinkButton href={reportUrl(stage)} className="mt-2">
          Read the {stage.name} report
        </LinkButton>
      </div>
      {next && (
        <NextStep
          eyebrow="Next stage"
          title={next.name}
          description={next.question}
          href={next.url}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────── answer editors

/**
 * Editors work on a copy of the block (the draft); nothing reaches the board
 * until Save. Each renders the block type's own shape: prose, a list, records
 * with their fields, or named values.
 */
function AnswerEditor({
  block,
  label,
  onChange,
}: {
  block: Block;
  /** The question, as the accessible name of a single answer box. */
  label: string;
  onChange: (next: Block) => void;
}) {
  switch (block.type) {
    case "statement":
      return (
        <StatementEditor block={block} label={label} onChange={onChange} />
      );
    case "list":
      return <ListEditor block={block} onChange={onChange} />;
    case "records":
      return <RecordsEditor block={block} onChange={onChange} />;
    case "metrics":
      return <MetricsEditor block={block} onChange={onChange} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Edit this one in the report.
        </p>
      );
  }
}

function StatementEditor({
  block,
  label,
  onChange,
}: {
  block: StatementBlock;
  label: string;
  onChange: (next: Block) => void;
}) {
  return (
    <Textarea
      aria-label={label}
      rows={5}
      value={block.body}
      onChange={(e) => onChange({ ...block, body: e.target.value })}
      placeholder="Write your answer in a sentence or two."
      className="min-h-32 text-[15px] leading-relaxed md:text-[15px]"
    />
  );
}

function ListEditor({
  block,
  onChange,
}: {
  block: ListBlock;
  onChange: (next: Block) => void;
}) {
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const update = (items: ListBlock["items"]) => onChange({ ...block, items });
  const addAfter = (i: number) => {
    const item = { id: newId("i"), text: "" };
    setFocusId(item.id);
    update([...block.items.slice(0, i + 1), item, ...block.items.slice(i + 1)]);
  };

  return (
    <div className="flex flex-col gap-2">
      {block.items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
          />
          <Input
            aria-label={`Item ${i + 1}`}
            autoFocus={item.id === focusId}
            value={item.text}
            placeholder={
              i === 0
                ? "Type one item, then press Enter for the next"
                : undefined
            }
            onChange={(e) =>
              update(
                block.items.map((it) =>
                  it.id === item.id ? { ...it, text: e.target.value } : it,
                ),
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                addAfter(i);
              }
            }}
            className="h-9"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove item ${i + 1}`}
            disabled={block.items.length === 1}
            onClick={() =>
              update(block.items.filter((it) => it.id !== item.id))
            }
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => addAfter(block.items.length - 1)}
      >
        <PlusIcon data-icon="inline-start" />
        Add another
      </Button>
    </div>
  );
}

/** Suggested values for badge fields that have a usual scale. */
const BADGE_SUGGESTIONS: Record<string, string[]> = {
  impact: ["High", "Medium", "Low"],
  probability: ["High", "Medium", "Low"],
  influence: ["High", "Medium", "Low"],
  priority: ["P0", "P1", "P2"],
};

function RecordsEditor({
  block,
  onChange,
}: {
  block: RecordsBlock;
  onChange: (next: Block) => void;
}) {
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const titleField = block.fields.find((f) => f.kind === "title");
  const otherFields = block.fields.filter((f) => f !== titleField);
  const noun = titleField?.label.toLowerCase() ?? "entry";
  const update = (items: RecordsBlock["items"]) =>
    onChange({ ...block, items });
  const setValue = (itemId: string, key: string, value: string) =>
    update(
      block.items.map((it) =>
        it.id === itemId
          ? { ...it, values: { ...it.values, [key]: value } }
          : it,
      ),
    );

  return (
    <div className="flex flex-col gap-3">
      {block.items.map((item, i) => (
        <fieldset
          key={item.id}
          className="flex flex-col gap-3 rounded-xl border p-4"
        >
          <legend className="sr-only">
            {titleField?.label ?? "Entry"} {i + 1}
          </legend>
          <div className="flex items-end gap-2">
            {titleField && (
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor={`${item.id}-${titleField.key}`}>
                  {titleField.label}
                </Label>
                <Input
                  id={`${item.id}-${titleField.key}`}
                  autoFocus={item.id === focusId}
                  value={item.values[titleField.key] ?? ""}
                  onChange={(e) =>
                    setValue(item.id, titleField.key, e.target.value)
                  }
                  className="h-9"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="mb-1"
              aria-label={`Remove ${noun} ${i + 1}`}
              disabled={block.items.length === 1}
              onClick={() =>
                update(block.items.filter((it) => it.id !== item.id))
              }
            >
              <XIcon />
            </Button>
          </div>
          {otherFields.map((field) => {
            const id = `${item.id}-${field.key}`;
            const suggestions = BADGE_SUGGESTIONS[field.key];
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={id}>{field.label}</Label>
                {field.kind === "badge" ? (
                  <>
                    <Input
                      id={id}
                      list={suggestions ? `${id}-options` : undefined}
                      value={item.values[field.key] ?? ""}
                      placeholder={
                        suggestions ? suggestions.join(", ") : undefined
                      }
                      onChange={(e) =>
                        setValue(item.id, field.key, e.target.value)
                      }
                      className="h-9 sm:max-w-56"
                    />
                    {suggestions && (
                      <datalist id={`${id}-options`}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    )}
                  </>
                ) : (
                  <Textarea
                    id={id}
                    rows={2}
                    value={item.values[field.key] ?? ""}
                    onChange={(e) =>
                      setValue(item.id, field.key, e.target.value)
                    }
                    className="min-h-14"
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          const record = emptyRecord(block, newId("rec"));
          setFocusId(record.id);
          update([...block.items, record]);
        }}
      >
        <PlusIcon data-icon="inline-start" />
        Add another {noun}
      </Button>
    </div>
  );
}

function MetricsEditor({
  block,
  onChange,
}: {
  block: MetricsBlock;
  onChange: (next: Block) => void;
}) {
  const update = (items: MetricsBlock["items"]) =>
    onChange({ ...block, items });
  const set = (itemId: string, patch: Partial<MetricsBlock["items"][number]>) =>
    update(
      block.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2 px-0.5 text-xs font-medium text-muted-foreground">
        <span>Name</span>
        <span>Value</span>
        <span className="w-7" />
      </div>
      {block.items.map((item, i) => (
        <div
          key={item.id}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-2"
        >
          <Input
            aria-label={`Name of row ${i + 1}`}
            value={item.label}
            onChange={(e) => set(item.id, { label: e.target.value })}
            className="h-9"
          />
          <Input
            aria-label={
              item.label ? `Value for ${item.label}` : `Value of row ${i + 1}`
            }
            value={item.value}
            onChange={(e) => set(item.id, { value: e.target.value })}
            className="h-9"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${item.label || `row ${i + 1}`}`}
            disabled={block.items.length === 1}
            onClick={() =>
              update(block.items.filter((it) => it.id !== item.id))
            }
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          update([...block.items, { id: newId("m"), label: "", value: "" }])
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add a row
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── draft helpers

function emptyRecord(
  block: RecordsBlock,
  id: string,
): RecordsBlock["items"][number] {
  return {
    id,
    values: Object.fromEntries(block.fields.map((f) => [f.key, ""])),
  };
}

/**
 * The block as the editor starts it: an empty list, record set or table gets
 * one blank row to type into. The placeholder row's id is fixed so it stays
 * the same input between renders.
 */
function toDraft(block: Block): Block {
  switch (block.type) {
    case "list":
      return block.items.length
        ? block
        : { ...block, items: [{ id: "draft-item", text: "" }] };
    case "records":
      return block.items.length
        ? block
        : { ...block, items: [emptyRecord(block, "draft-record")] };
    case "metrics":
      return block.items.length
        ? block
        : { ...block, items: [{ id: "draft-row", label: "", value: "" }] };
    default:
      return block;
  }
}

/** The draft as it will be saved: blank rows dropped, text trimmed. */
function clean(block: Block): Block {
  switch (block.type) {
    case "statement":
      return { ...block, body: block.body.trim() };
    case "list":
      return {
        ...block,
        items: block.items
          .map((it) => ({ ...it, text: it.text.trim() }))
          .filter((it) => it.text),
      };
    case "records":
      return {
        ...block,
        items: block.items
          .map((it) => ({
            ...it,
            values: Object.fromEntries(
              Object.entries(it.values).map(([k, v]) => [k, v.trim()]),
            ),
          }))
          .filter((it) => Object.values(it.values).some(Boolean)),
      };
    case "metrics":
      return {
        ...block,
        items: block.items
          .map((it) => ({
            ...it,
            label: it.label.trim(),
            value: it.value.trim(),
          }))
          .filter((it) => it.label || it.value),
      };
    default:
      return block;
  }
}

/** Copies an answer's content onto the stored block, leaving its title, description and layout alone. */
function applyAnswer(target: Block, answer: Block) {
  if (target.type === "statement" && answer.type === "statement")
    target.body = answer.body;
  else if (target.type === "list" && answer.type === "list")
    target.items = answer.items;
  else if (target.type === "records" && answer.type === "records")
    target.items = answer.items;
  else if (target.type === "metrics" && answer.type === "metrics")
    target.items = answer.items;
}

/** What's missing before Save, in plain words. */
function requirement(block: Block): string {
  switch (block.type) {
    case "statement":
      return "Write your answer to continue.";
    case "list":
      return "Add at least one item to continue.";
    case "records": {
      const title =
        block.fields.find((f) => f.kind === "title")?.label.toLowerCase() ??
        "entry";
      return `Add at least one ${title} to continue.`;
    }
    case "metrics":
      return "Fill in every value, or remove the rows that don't apply.";
    default:
      return "";
  }
}
