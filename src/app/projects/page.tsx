"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutGridIcon, ListIcon, PlusIcon } from "lucide-react";

import { CompletionMark } from "@/components/completion-mark";
import { PageColumn, PageHeader, Row, RowList, SectionLabel } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAGES } from "@/lib/navigation";
import type { Board, ProjectType } from "@/lib/product-board/schema";
import { SEED_BOARD } from "@/lib/product-board/seed";
import { listBoards } from "@/lib/product-board/storage";
import { createProject, initialProjectWork, isSampleProject, setCurrentProjectId } from "@/lib/projects";
import { stageProgress } from "@/lib/stages";
import { cn } from "@/lib/utils";

type ProjectView = "list" | "cards";
const VIEW_KEY = "product-studio:projects-view";

function readSavedView(): ProjectView {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "list";
  } catch {
    return "list";
  }
}

function saveView(view: ProjectView) {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Storage blocked: the choice just won't be remembered.
  }
}

/**
 * Every project, with the state of its five stages. Opening one makes it the
 * open project for every page under the main layout. A new project starts
 * blank and opens on Discover, where its first question is waiting.
 */
export default function ProjectsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const router = useRouter();
  // The sidebar's "New project" links here with ?new=1 to open the dialog straight away.
  const { new: openNew } = React.use(searchParams);
  const [dialogOpen, setDialogOpen] = React.useState(openNew === "1");
  const [projects, setProjects] = React.useState<Board[] | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [view, setView] = React.useState<ProjectView>("list");

  React.useEffect(() => {
    let cancelled = false;
    listBoards().then((result) => {
      if (cancelled) return;
      // The saved view is read here, client-side, so the server render and first paint agree.
      setView(readSavedView());
      // The sample is always listed, even before its first save.
      const boards = result.boards.some((b) => isSampleProject(b.id)) ? result.boards : [...result.boards, SEED_BOARD];
      setProjects(boards);
      setWarning(result.warning ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const changeView = (next: ProjectView) => {
    setView(next);
    saveView(next);
  };

  const open = (board: Board) => {
    setCurrentProjectId(board.id);
    router.push("/overview");
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PageColumn className="lg:py-12">
        <PageHeader
          eyebrow="Product Studio"
          title="Projects"
          description="Pick up where you left off, or start something new."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              New project
            </Button>
          }
        />

        {warning && <p className="text-sm text-muted-foreground">{warning}</p>}

        <section aria-label="Your projects">
          <SectionLabel
            aside={
              <Tabs value={view} onValueChange={(value) => changeView(value as ProjectView)}>
                <TabsList aria-label="Choose how projects are shown">
                  <TabsTrigger value="list" className="px-2">
                    <ListIcon data-icon="inline-start" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="px-2">
                    <LayoutGridIcon data-icon="inline-start" />
                    Cards
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            Your projects
          </SectionLabel>

          {projects === null ? (
            <ProjectsSkeleton view={view} />
          ) : view === "cards" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((board) => (
                <ProjectCard key={board.id} board={board} onOpen={() => open(board)} />
              ))}
            </div>
          ) : (
            <RowList>
              {projects.map((board) => (
                <Row
                  key={board.id}
                  onClick={() => open(board)}
                  lead={<ProjectTile name={board.productName} />}
                  title={<ProjectName board={board} />}
                  description={[summary(board), meta(board)].filter(Boolean).join(" · ")}
                  trail={<StageStrip board={board} className="hidden sm:flex" />}
                />
              ))}
            </RowList>
          )}
        </section>
      </PageColumn>

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => router.push("/discover")}
      />
    </div>
  );
}

function summary(board: Board): string | undefined {
  return (
    board.description ??
    (isSampleProject(board.id) ? "A finished example to look around and learn from." : undefined)
  );
}

function meta(board: Board): string {
  const type = board.projectType === "engagement" ? "Client engagement" : "Product";
  return `${type} · Updated ${updatedLabel(board.updatedAt)}`;
}

function ProjectName({ board }: { board: Board }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      {board.productName}
      {isSampleProject(board.id) && <StatusPill>Sample</StatusPill>}
    </span>
  );
}

/**
 * Every card has the same slots in the same places, filled or not: name,
 * a meta line, a two-line description slot, the stage strip. "Sample" is a
 * word in the meta line rather than a badge, so it doesn't shift the name.
 */
function ProjectCard({ board, onOpen }: { board: Board; onOpen: () => void }) {
  const what = summary(board);
  const metaLine = [isSampleProject(board.id) ? "Sample" : undefined, meta(board)].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
    >
      <span className="flex items-center gap-3">
        <ProjectTile name={board.productName} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm leading-snug font-medium">{board.productName}</span>
          <span className="truncate text-[13px] leading-snug text-muted-foreground">{metaLine}</span>
        </span>
      </span>
      <span className="line-clamp-2 min-h-[2lh] text-[13px] leading-snug text-muted-foreground">{what}</span>
      <StageStrip board={board} />
    </button>
  );
}

function ProjectsSkeleton({ view }: { view: ProjectView }) {
  if (view === "cards") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-[18px] w-28" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col divide-y border-y">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-1.5 py-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function updatedLabel(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "recently";
  const days = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ProjectTile({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
      {initials}
    </span>
  );
}

/** The five stages: a green check for each complete one, its number otherwise. */
function StageStrip({ board, className }: { board: Board; className?: string }) {
  const progress = React.useMemo(
    () => stageProgress({ board, ...initialProjectWork(board.id) }),
    [board]
  );
  const complete = STAGES.filter((stage) => progress[stage.id].complete).length;
  return (
    <span className={cn("flex shrink-0 items-center gap-1", className)} role="img" aria-label={`${complete} of ${STAGES.length} stages complete`}>
      {STAGES.map((stage) =>
        progress[stage.id].complete ? (
          <CompletionMark key={stage.id} complete size="sm" className="size-[18px]" />
        ) : (
          <span
            key={stage.id}
            aria-hidden
            className="flex size-[18px] items-center justify-center rounded-full border font-mono text-[9.5px] text-muted-foreground"
          >
            {stage.step}
          </span>
        )
      )}
    </span>
  );
}

const PROJECT_TYPES: { value: ProjectType; title: string; detail: string }[] = [
  { value: "product", title: "A product", detail: "Continuous. Stages show progress and never close." },
  { value: "engagement", title: "A client engagement", detail: "Phased. The client signs off each stage." },
];

function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (board: Board) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [projectType, setProjectType] = React.useState<ProjectType>("product");
  const [creating, setCreating] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const board = await createProject({ name: name.trim(), description: description.trim(), projectType });
      onCreated(board);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Start a new project</DialogTitle>
            <DialogDescription>
              It starts blank. Discover opens first, and walks you through each question.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">What are you making, in one line?</Label>
            <Input
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For example: a booking app for small physio clinics"
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">How is it run?</legend>
            {PROJECT_TYPES.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50",
                  projectType === option.value && "border-foreground"
                )}
              >
                <input
                  type="radio"
                  name="project-type"
                  value={option.value}
                  checked={projectType === option.value}
                  onChange={() => setProjectType(option.value)}
                  className="mt-1 accent-foreground"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.title}</span>
                  <span className="text-[13px] text-muted-foreground">{option.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || creating}>
              {creating ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
