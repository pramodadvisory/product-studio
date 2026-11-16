/**
 * Checks a proposed change against the project before anyone sees it.
 *
 * Schema validation alone isn't enough: the model can name a block that
 * doesn't exist, add a list item to a statement, or file a story under a
 * feature that isn't on the map. The route runs this on every tool call and
 * sends failures back to the model as errors so it can correct itself; only
 * proposals that would apply cleanly reach the product manager.
 */
import {
  BoardUpdateInput,
  DecisionInput,
  HypothesisInput,
  StoryInput,
  type Proposal,
  type ProjectSnapshot,
  type SnapshotBlock,
} from "./schema";

type Check = { ok: true; proposal: Proposal } | { ok: false; error: string };

function findSnapshotBlock(snapshot: ProjectSnapshot, id: string): SnapshotBlock | undefined {
  for (const page of snapshot.pages) {
    const block = page.blocks.find((b) => b.id === id);
    if (block) return block;
  }
  return undefined;
}

function issues(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
}

export function checkProposal(id: string, tool: string, raw: unknown, snapshot: ProjectSnapshot): Check {
  switch (tool) {
    case "propose_board_update": {
      const parsed = BoardUpdateInput.safeParse(raw);
      if (!parsed.success) return { ok: false, error: `Invalid input. ${issues(parsed.error)}` };
      const input = parsed.data;
      const block = findSnapshotBlock(snapshot, input.block_id);
      if (!block) return { ok: false, error: `No block with id "${input.block_id}". Use an id from the snapshot.` };
      const wrongType = (expected: string) =>
        ({ ok: false, error: `Block "${block.id}" is a ${block.type} block; ${input.operation} needs a ${expected} block.` }) as const;

      switch (input.operation) {
        case "replace_statement":
          if (block.type !== "statement") return wrongType("statement");
          if (!input.text?.trim()) return { ok: false, error: "replace_statement needs `text`." };
          break;
        case "add_list_item":
          if (block.type !== "list") return wrongType("list");
          if (!input.text?.trim()) return { ok: false, error: "add_list_item needs `text`." };
          break;
        case "complete_list_item": {
          if (block.type !== "list") return wrongType("list");
          const content = block.content as { checkable: boolean; items: { id: string }[] };
          if (!content.checkable) return { ok: false, error: `Block "${block.id}" has no checkboxes.` };
          if (!input.item_id || !content.items.some((i) => i.id === input.item_id))
            return { ok: false, error: `complete_list_item needs an \`item_id\` from block "${block.id}".` };
          break;
        }
        case "add_record": {
          if (block.type !== "records") return wrongType("records");
          const content = block.content as { fields: { key: string }[] };
          const keys = new Set(content.fields.map((f) => f.key));
          if (!input.record?.length) return { ok: false, error: "add_record needs `record`." };
          const unknown = input.record.filter((f) => !keys.has(f.field)).map((f) => f.field);
          if (unknown.length)
            return { ok: false, error: `Unknown fields ${unknown.join(", ")}. This block's fields are: ${[...keys].join(", ")}.` };
          break;
        }
        case "set_metric":
          if (block.type !== "metrics") return wrongType("metrics");
          if (!input.metric?.label.trim() || !input.metric.value.trim())
            return { ok: false, error: "set_metric needs `metric` with a label and a value." };
          break;
        case "set_confidence":
          break;
      }
      return { ok: true, proposal: { id, tool: "propose_board_update", input } };
    }

    case "propose_decision": {
      const parsed = DecisionInput.safeParse(raw);
      if (!parsed.success) return { ok: false, error: `Invalid input. ${issues(parsed.error)}` };
      return { ok: true, proposal: { id, tool: "propose_decision", input: parsed.data } };
    }

    case "propose_hypothesis": {
      const parsed = HypothesisInput.safeParse(raw);
      if (!parsed.success) return { ok: false, error: `Invalid input. ${issues(parsed.error)}` };
      const linked = parsed.data.tests_block_id;
      if (linked && !findSnapshotBlock(snapshot, linked))
        return { ok: false, error: `No block with id "${linked}" for tests_block_id. Use an id from the snapshot or null.` };
      return { ok: true, proposal: { id, tool: "propose_hypothesis", input: parsed.data } };
    }

    case "propose_story": {
      const parsed = StoryInput.safeParse(raw);
      if (!parsed.success) return { ok: false, error: `Invalid input. ${issues(parsed.error)}` };
      const { feature_id, sprint_id } = parsed.data;
      if (!snapshot.storyMap.features.some((f) => f.id === feature_id))
        return { ok: false, error: `No feature with id "${feature_id}". Use a feature id from the snapshot.` };
      if (!snapshot.storyMap.sprints.some((s) => s.id === sprint_id))
        return { ok: false, error: `No sprint with id "${sprint_id}". Use a sprint id from the snapshot, or "backlog".` };
      return { ok: true, proposal: { id, tool: "propose_story", input: parsed.data } };
    }

    default:
      return { ok: false, error: `Unknown tool "${tool}".` };
  }
}
