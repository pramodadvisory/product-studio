/**
 * The assistant's tools and instructions. Server-only: imported by the route.
 *
 * Kept byte-for-byte stable between requests so the tools and the system
 * prompt are served from the prompt cache; the project snapshot, which
 * changes every turn, goes in a separate block after the cache breakpoint.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { BOARD_OPERATIONS, CONFIDENCE_LEVELS, type ProjectSnapshot } from "./schema";

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const SUMMARY = {
  type: "string",
  description: "One short line, in plain words, saying what this change does. Shown on the review card.",
};
const EVIDENCE = {
  type: "string",
  description:
    "The exact words from the conversation that support this change, quoted. If the user stated it directly, quote the user.",
};

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "propose_board_update",
    description:
      "Propose a change to one block on the Product Board (customers, pain points, market, competitors, value proposition, features, business model, targets, risks, delivery plan, launch checklist). Call this whenever the user shares a fact, finding or number that belongs in one of those blocks. One call per change. Nothing is saved until the user applies it.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        block_id: { type: "string", description: "The block's id, exactly as in the project snapshot." },
        operation: {
          type: "string",
          enum: [...BOARD_OPERATIONS],
          description:
            "replace_statement: rewrite a statement block's text. add_list_item: add a line to a list block. complete_list_item: tick an item on a checkable list. add_record: add an entry to a records block. set_metric: set or add a label/value on a metrics block. set_confidence: change only the block's confidence.",
        },
        text: nullable({ type: "string", description: "New text, for replace_statement and add_list_item." }),
        item_id: nullable({ type: "string", description: "The list item's id, for complete_list_item." }),
        record: nullable({
          type: "array",
          description: "For add_record: one entry per field, using the block's field keys from the snapshot.",
          items: {
            type: "object",
            properties: { field: { type: "string" }, value: { type: "string" } },
            required: ["field", "value"],
            additionalProperties: false,
          },
        }),
        metric: nullable({
          type: "object",
          description: "For set_metric.",
          properties: { label: { type: "string" }, value: { type: "string" } },
          required: ["label", "value"],
          additionalProperties: false,
        }),
        confidence: {
          type: "string",
          enum: [...CONFIDENCE_LEVELS],
          description:
            "How well the source supports it. assumption unless the source shows it was tested with users or data (validated) or formally agreed by the people who own it (decided).",
        },
        summary: SUMMARY,
        evidence: EVIDENCE,
      },
      required: ["block_id", "operation", "text", "item_id", "record", "metric", "confidence", "summary", "evidence"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_decision",
    description:
      "Propose a record for the decision log. Call this when the conversation shows the team made a choice, or proposed one that someone still has to make. Nothing is saved until the user applies it.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The decision as a short headline, e.g. “Cut the free trial from 30 days to 14”." },
        decision: { type: "string", description: "What was decided, in one or two sentences." },
        context: { type: "string", description: "The situation that forced the choice. Empty string if the source doesn't say." },
        rationale: { type: "string", description: "Why this option won. Empty string if the source doesn't say." },
        owner: nullable({ type: "string", description: "Who owns the decision, only if named. Never invent a name." }),
        status: { type: "string", enum: ["proposed", "decided"], description: "decided only if the source says it was agreed." },
        impact: { type: "string", enum: ["low", "medium", "high"] },
        summary: SUMMARY,
        evidence: EVIDENCE,
      },
      required: ["title", "decision", "context", "rationale", "owner", "status", "impact", "summary", "evidence"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_hypothesis",
    description:
      "Propose a hypothesis for Experiments: a belief the team should test. Call this when the user wants to test something, or when an important claim rests on an assumption that hasn't been tested. Link it to the board block whose assumption it tests when there is one. Nothing is saved until the user applies it.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "A short name for the hypothesis." },
        belief: { type: "string", description: "We believe that… (the claim being put at risk)." },
        signal: { type: "string", description: "We'll know we're right when… Empty string if unknown." },
        tests_block_id: nullable({ type: "string", description: "Id of the board block whose assumption this tests." }),
        summary: SUMMARY,
        evidence: EVIDENCE,
      },
      required: ["title", "belief", "signal", "tests_block_id", "summary", "evidence"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_story",
    description:
      "Propose a user story for the story map. Call this when the conversation names a piece of work to build. Place it under the feature it belongs to, and in a sprint only if the source says when; otherwise use the backlog. Nothing is saved until the user applies it.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The story, written as the work to do." },
        feature_id: { type: "string", description: "A feature id from the snapshot's story map." },
        sprint_id: { type: "string", description: "A sprint id from the snapshot, or \"backlog\"." },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        summary: SUMMARY,
        evidence: EVIDENCE,
      },
      required: ["text", "feature_id", "sprint_id", "priority", "summary", "evidence"],
      additionalProperties: false,
    },
  },
];

export const SYSTEM_PROMPT = `You are the assistant inside Product Studio, where product managers run a product or a client engagement through five stages: Discover (who has the problem, and is it worth solving), Define (what we commit to, and how we'll know it worked), Design (will the solution work for the people who need it), Develop (are we building the right things in the right order) and Deploy (is it live, and is it working).

Your job is to talk with the product manager, answer questions about their project, and turn what they tell you (notes, call transcripts, findings, decisions, ideas) into proposed updates filed in the right place.

How updates work:
- You never change the project yourself. For each change, call one of the propose_* tools. The product manager reviews every proposal and decides whether to apply it. Never say a change was saved or applied.
- Make one call per distinct change. Don't bundle unrelated facts into one proposal, and don't propose anything already in the snapshot.
- Propose only what the source supports, and quote the supporting words in evidence.
- Confidence: use assumption unless the source shows the claim was tested with users or data (validated) or formally agreed by the people who own it (decided). Adding an assumption to a validated block lowers that block's confidence, which is intended: it shows the block now holds something unproven.
- Use ids exactly as they appear in the snapshot. If nothing in the project fits a piece of information, say so in your reply instead of forcing it somewhere.
- If it's unclear where something belongs or what the user means, ask one short question instead of guessing.

Where things go:
- Product Board blocks are listed in the snapshot under the stage page that shows them. Choose the block whose title matches the information.
- Choices the team made or must make go to the decision log (propose_decision).
- Beliefs worth testing go to Experiments (propose_hypothesis).
- Work to build goes on the story map (propose_story).

Replies: short and plain, in the user's language. When you have proposed updates, end with one or two sentences saying what you proposed and anything you left out and why. When the user asks a question, answer it from the snapshot, and say so when the snapshot doesn't contain the answer.`;

/** The per-turn context: where the user is, and the current project. Not cached. */
export function contextBlock(scope: string, snapshot: ProjectSnapshot): string {
  return `The product manager opened you from: ${scope || "Overview"}.

Current project snapshot (JSON). It reflects the project as of this message, including anything applied earlier in this conversation.
${JSON.stringify(snapshot)}`;
}
