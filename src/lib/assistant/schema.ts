/**
 * The contract between the assistant route and the browser.
 *
 * The model never writes to the project. It calls one of four propose_* tools;
 * the route validates each call against the project snapshot and streams the
 * valid ones to the browser as proposals. The product manager then applies or
 * skips each one, and only Apply changes anything.
 */
import { z } from "zod";

export const CONFIDENCE_LEVELS = ["assumption", "validated", "decided"] as const;

export const BOARD_OPERATIONS = [
  "replace_statement",
  "add_list_item",
  "complete_list_item",
  "add_record",
  "set_metric",
  "set_confidence",
] as const;

const shared = {
  /** One short line the card shows as the change. */
  summary: z.string().min(1),
  /** The words from the conversation that support the change. */
  evidence: z.string().min(1),
};

export const BoardUpdateInput = z.object({
  block_id: z.string().min(1),
  operation: z.enum(BOARD_OPERATIONS),
  text: z.string().nullable(),
  item_id: z.string().nullable(),
  record: z.array(z.object({ field: z.string(), value: z.string() })).nullable(),
  metric: z.object({ label: z.string(), value: z.string() }).nullable(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  ...shared,
});

export const DecisionInput = z.object({
  title: z.string().min(1),
  decision: z.string().min(1),
  context: z.string(),
  rationale: z.string(),
  owner: z.string().nullable(),
  status: z.enum(["proposed", "decided"]),
  impact: z.enum(["low", "medium", "high"]),
  ...shared,
});

export const HypothesisInput = z.object({
  title: z.string().min(1),
  belief: z.string().min(1),
  signal: z.string(),
  tests_block_id: z.string().nullable(),
  ...shared,
});

export const StoryInput = z.object({
  text: z.string().min(1),
  feature_id: z.string().min(1),
  sprint_id: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  ...shared,
});

export type BoardUpdate = z.infer<typeof BoardUpdateInput>;
export type DecisionProposalInput = z.infer<typeof DecisionInput>;
export type HypothesisProposalInput = z.infer<typeof HypothesisInput>;
export type StoryProposalInput = z.infer<typeof StoryInput>;

export type Proposal =
  | { id: string; tool: "propose_board_update"; input: BoardUpdate }
  | { id: string; tool: "propose_decision"; input: DecisionProposalInput }
  | { id: string; tool: "propose_hypothesis"; input: HypothesisProposalInput }
  | { id: string; tool: "propose_story"; input: StoryProposalInput };

export type ProposalTool = Proposal["tool"];

/** One line of the route's NDJSON response. */
export type AssistantEvent =
  | { type: "text"; text: string }
  | { type: "proposal"; proposal: Proposal }
  | { type: "error"; message: string }
  | { type: "done" };

// ─── Project snapshot ──────────────────────────────────────────────────────

/** A compact, JSON-safe picture of the project the model reads each turn. */
export type ProjectSnapshot = {
  project: {
    name: string;
    type: "product" | "engagement";
    focusStage: string;
  };
  /** Product Board content, grouped by the stage page that shows it. */
  pages: { path: string; blocks: SnapshotBlock[] }[];
  decisions: { title: string; status: string; owner: string }[];
  hypotheses: { id: string; title: string; status: string }[];
  storyMap: {
    features: { id: string; title: string; goal: string }[];
    /** Includes the backlog, id "backlog". */
    sprints: { id: string; name: string }[];
  };
};

export type SnapshotBlock = {
  id: string;
  title: string;
  type: "statement" | "metrics" | "list" | "records" | "timeline" | "chart";
  confidence: string | null;
  content:
    | { body: string }
    | { checkable: boolean; items: { id: string; text: string; done: boolean }[] }
    | { fields: { key: string; label: string }[]; items: string[] }
    | { items: { label: string; value: string }[] }
    | { summary: string };
};

// Loose shapes for checking a request body. The snapshot comes from the
// user's own browser, so this guards structure and size, not trust.
export const ChatRequest = z.object({
  message: z.string().min(1).max(60_000),
  scope: z.string().max(200),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(60_000) }))
    .max(40),
  snapshot: z.object({
    project: z.object({ name: z.string(), type: z.enum(["product", "engagement"]), focusStage: z.string() }),
    pages: z.array(z.object({ path: z.string(), blocks: z.array(z.any()) })),
    decisions: z.array(z.any()),
    hypotheses: z.array(z.any()),
    storyMap: z.object({ features: z.array(z.any()), sprints: z.array(z.any()) }),
  }),
});
export type ChatRequestBody = z.infer<typeof ChatRequest>;
