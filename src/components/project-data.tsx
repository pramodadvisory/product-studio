"use client";

import * as React from "react";
import type { TaskBoard } from "@/app/(main)/design/experiments/tasks";
import type { Sprint, StoryMap } from "@/app/(main)/develop/story-map/storymap";
import { useDecisions } from "@/hooks/use-decisions";
import type { StageId } from "@/lib/navigation";
import type { ProjectType } from "@/lib/product-board/schema";
import { useBoard, type BoardController } from "@/lib/product-board/use-board";
import { useProjectDoc } from "@/lib/project-work/use-project-doc";
import {
  SAMPLE_PROJECT_ID,
  getCurrentProjectId,
  initialProjectWork,
  setCurrentProjectId,
  subscribeCurrentProject,
  type ProjectWork,
} from "@/lib/projects";
import { focusStage, stageProgress, type StageProgress } from "@/lib/stages";

/**
 * Project-wide data that more than one page reads, for the open project.
 *
 * Loaded once here, in the main layout, rather than by each page. The sidebar,
 * the Overview, the stage pages and the assistant all read the same copy, so
 * an edit on one page is what the next page sees, with no second loader
 * racing a pending save. Which project is open is remembered in this browser
 * (see `src/lib/projects.ts`), so it's only known after mount.
 *
 * Everything here is saved to Supabase, with a copy in this browser as the
 * fallback: the board in `product_boards`, and the decisions, experiments,
 * story map and sprints in `project_work`.
 */
type DecisionsController = ReturnType<typeof useDecisions>;

type ExperimentsController = {
  experiments: TaskBoard;
  setExperiments: React.Dispatch<React.SetStateAction<TaskBoard>>;
};

type StoryMapController = {
  map: StoryMap;
  setMap: React.Dispatch<React.SetStateAction<StoryMap>>;
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
};

const BoardContext = React.createContext<BoardController | null>(null);
const DecisionsContext = React.createContext<DecisionsController | null>(null);
const ExperimentsContext = React.createContext<ExperimentsController | null>(null);
const StoryMapContext = React.createContext<StoryMapController | null>(null);

const NO_WORK: ProjectWork = { experiments: [], storyMap: { goals: [], features: [], storiesByCell: {} }, sprints: [] };

const seedExperiments = (projectId: string) => initialProjectWork(projectId).experiments;
const seedStoryMap = (projectId: string) => initialProjectWork(projectId).storyMap;
const seedSprints = (projectId: string) => initialProjectWork(projectId).sprints;

export function ProjectDataProvider({ children }: { children: React.ReactNode }) {
  // Null on the server and while hydrating; the open project's id after that.
  const projectId = React.useSyncExternalStore(subscribeCurrentProject, getCurrentProjectId, () => null);

  const { value: experiments, setValue: setExperiments } = useProjectDoc<TaskBoard>({
    projectId,
    kind: "experiments",
    seed: seedExperiments,
    empty: NO_WORK.experiments,
  });
  const { value: map, setValue: setMap } = useProjectDoc<StoryMap>({
    projectId,
    kind: "story_map",
    seed: seedStoryMap,
    empty: NO_WORK.storyMap,
  });
  const { value: sprints, setValue: setSprints } = useProjectDoc<Sprint[]>({
    projectId,
    kind: "sprints",
    seed: seedSprints,
    empty: NO_WORK.sprints,
  });

  const onMissing = React.useCallback(() => setCurrentProjectId(SAMPLE_PROJECT_ID), []);
  const board = useBoard(projectId, onMissing);
  const decisions = useDecisions(board.board?.id ?? null);

  const experimentsValue = React.useMemo(() => ({ experiments, setExperiments }), [experiments, setExperiments]);
  const storyMapValue = React.useMemo(() => ({ map, setMap, sprints, setSprints }), [map, setMap, sprints, setSprints]);

  return (
    <BoardContext.Provider value={board}>
      <DecisionsContext.Provider value={decisions}>
        <ExperimentsContext.Provider value={experimentsValue}>
          <StoryMapContext.Provider value={storyMapValue}>{children}</StoryMapContext.Provider>
        </ExperimentsContext.Provider>
      </DecisionsContext.Provider>
    </BoardContext.Provider>
  );
}

function useRequired<T>(context: React.Context<T | null>, name: string): T {
  const value = React.useContext(context);
  if (!value) throw new Error(`${name} must be used inside <ProjectDataProvider>`);
  return value;
}

export function useProjectBoard(): BoardController {
  return useRequired(BoardContext, "useProjectBoard");
}

export function useProjectDecisions(): DecisionsController {
  return useRequired(DecisionsContext, "useProjectDecisions");
}

export function useProjectExperiments(): ExperimentsController {
  return useRequired(ExperimentsContext, "useProjectExperiments");
}

export function useProjectStoryMap(): StoryMapController {
  return useRequired(StoryMapContext, "useProjectStoryMap");
}

export type ProjectProgress = {
  projectType: ProjectType;
  progress: Record<StageId, StageProgress>;
  focus: StageId;
};

/** Stage progress and the focus stage, or null while the board is loading. */
export function useProjectProgress(): ProjectProgress | null {
  const { board } = useProjectBoard();
  const { experiments } = useProjectExperiments();
  const { map, sprints } = useProjectStoryMap();

  return React.useMemo(() => {
    if (!board) return null;
    const projectType = board.projectType ?? "product";
    const progress = stageProgress({ board, experiments, storyMap: map, sprints });
    return { projectType, progress, focus: focusStage(progress, projectType, board.signoffs) };
  }, [board, experiments, map, sprints]);
}
