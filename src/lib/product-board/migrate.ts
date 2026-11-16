import { blankGroup } from "./blank";
import { BOARD_SCHEMA_VERSION, isBoardCompatible, type Board } from "./schema";
import { EXPERIENCE_GROUP, SEED_BOARD } from "./seed";

/**
 * Brings a stored board up to the current schema, keeping its content.
 * Returns null when the board is too old to migrate (it is then reseeded).
 *
 *   v7 → v8  adds Define's "Experience & design" group. The sample project
 *            gets the sample answers; any other board gets it blank.
 */
export function migrateBoard(value: unknown): Board | null {
  if (!value || typeof value !== "object") return null;
  const board = structuredClone(value) as Board;

  if (board.schemaVersion === 7) {
    const solution = board.sections?.find((s) => s.id === "solution");
    const hasGroup = board.sections?.some((s) => s.groups?.some((g) => g.id === EXPERIENCE_GROUP.id));
    if (solution && !hasGroup) {
      solution.groups.push(
        board.id === SEED_BOARD.id ? structuredClone(EXPERIENCE_GROUP) : blankGroup(EXPERIENCE_GROUP)
      );
    }
    board.schemaVersion = 8;
  }

  return board.schemaVersion === BOARD_SCHEMA_VERSION && isBoardCompatible(board) ? board : null;
}
