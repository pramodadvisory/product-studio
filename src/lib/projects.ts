/**
 * Projects: which one is open, making new ones, and deleting or leaving one.
 *
 * Each project is one stored board. The open project's id is remembered in
 * this browser, so every page under the main layout reads the same project
 * without carrying its id in the URL. The sample project (the demo board) is
 * always there; a new project starts blank.
 */
import { SEED_BOARD as SAMPLE_EXPERIMENTS } from "@/app/(main)/design/experiments/seed-data";
import type { TaskBoard } from "@/app/(main)/design/experiments/tasks";
import { initialSprints, initialStoryMap } from "@/app/(main)/develop/story-map/seed-data";
import type { Sprint, StoryMap } from "@/app/(main)/develop/story-map/storymap";
import { createBlankBoard } from "@/lib/product-board/blank";
import type { Board, ProjectType } from "@/lib/product-board/schema";
import { SEED_BOARD } from "@/lib/product-board/seed";
import { removeCollaborator } from "@/lib/collaborators";
import { forgetBoard, getSupabaseClient, saveBoard } from "@/lib/product-board/storage";
import { forgetWork } from "@/lib/project-work/storage";

export const SAMPLE_PROJECT_ID = SEED_BOARD.id;

const CURRENT_PROJECT_KEY = "product-studio:current-project";

export function isSampleProject(id: string): boolean {
  return id === SAMPLE_PROJECT_ID;
}

export function getCurrentProjectId(): string {
  try {
    return window.localStorage.getItem(CURRENT_PROJECT_KEY) || SAMPLE_PROJECT_ID;
  } catch {
    return SAMPLE_PROJECT_ID;
  }
}

const listeners = new Set<() => void>();

/**
 * For `useSyncExternalStore`: tells this tab when the open project changes.
 * Other tabs are deliberately not followed, so switching project in one tab
 * never swaps the project under someone mid-edit in another.
 */
export function subscribeCurrentProject(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCurrentProjectId(id: string) {
  try {
    window.localStorage.setItem(CURRENT_PROJECT_KEY, id);
  } catch {
    // Storage blocked: the sample project opens instead.
  }
  listeners.forEach((listener) => listener());
}

export type ProjectWork = {
  experiments: TaskBoard;
  storyMap: StoryMap;
  sprints: Sprint[];
};

/**
 * The experiments, story map and sprints a project starts with before anything
 * has been saved for it. The sample starts with its sample work; any other
 * project starts with none.
 */
export function initialProjectWork(projectId: string): ProjectWork {
  if (isSampleProject(projectId)) {
    return { experiments: SAMPLE_EXPERIMENTS, storyMap: initialStoryMap, sprints: initialSprints };
  }
  return { experiments: [], storyMap: { goals: [], features: [], storiesByCell: {} }, sprints: [] };
}

function newProjectId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);
  return `project-${random}`;
}

/** Creates a blank project, saves it, and makes it the open project. */
export async function createProject({
  name,
  description,
  projectType,
}: {
  name: string;
  description?: string;
  projectType: ProjectType;
}): Promise<Board> {
  const board = createBlankBoard({ id: newProjectId(), name, description, projectType });
  await saveBoard(board);
  setCurrentProjectId(board.id);
  return board;
}

/**
 * Takes a deleted or left project off this browser: its copies go, nothing
 * more is saved for it, and if it was open the sample opens instead.
 */
function closeProject(projectId: string) {
  forgetBoard(projectId);
  forgetWork(projectId);
  if (getCurrentProjectId() === projectId) setCurrentProjectId(SAMPLE_PROJECT_ID);
}

/**
 * Deletes a project for everyone on it: the board, its work, its members and
 * its published link. Only the owner can; the database checks (see
 * supabase/migrations/0006). With Supabase off, it only removes this
 * browser's copy.
 */
export async function deleteProject(projectId: string): Promise<void> {
  if (isSampleProject(projectId)) throw new Error("The sample project can't be deleted.");
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.rpc("delete_project", { p_board_id: projectId });
    if (error) {
      throw new Error(error.code === "42501" ? "Only the project owner can delete it." : error.message);
    }
  }
  closeProject(projectId);
}

/** Takes the signed-in person off a project they don't own. */
export async function leaveProject(projectId: string, userId: string): Promise<void> {
  await removeCollaborator(projectId, userId);
  closeProject(projectId);
}
