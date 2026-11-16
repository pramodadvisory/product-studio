import Anthropic from "@anthropic-ai/sdk";
import { contextBlock, SYSTEM_PROMPT, TOOLS } from "@/lib/assistant/prompt";
import { ChatRequest, type AssistantEvent, type ProjectSnapshot } from "@/lib/assistant/schema";
import { checkProposal } from "@/lib/assistant/validate";

/**
 * POST /api/assistant — one turn of the in-app assistant.
 *
 * Runs on the server so the API key never reaches the browser. Streams NDJSON
 * events back: text as it's written, then each validated proposal. The model
 * only proposes; nothing here writes project data.
 *
 * Within a turn, the full assistant content (thinking blocks included) is
 * passed back unchanged on each tool-loop step. Across turns the browser sends
 * the conversation as plain text, which replays no earlier thinking, so the
 * project snapshot is free to change from one turn to the next.
 */

const MODEL = "claude-opus-5-5";
/** Model calls per turn: proposals, then corrections of any that failed validation, then the closing reply. */
const MAX_STEPS = 4;

const TOOL_RESULT_SHOWN =
  "Shown to the product manager as a proposed update. It is not applied unless they choose to apply it.";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const parsed = ChatRequest.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "The request is missing a message, scope, history or snapshot." }, { status: 400 });
  }
  const { message, scope, history } = parsed.data;
  const snapshot = parsed.data.snapshot as ProjectSnapshot;

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AssistantEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runTurn({ message, scope, history, snapshot, send, signal: request.signal });
        send({ type: "done" });
      } catch (error) {
        console.error("[assistant]", error);
        send({ type: "error", message: describeError(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function runTurn({
  message,
  scope,
  history,
  snapshot,
  send,
  signal,
}: {
  message: string;
  scope: string;
  history: { role: "user" | "assistant"; text: string }[];
  snapshot: ProjectSnapshot;
  send: (event: AssistantEvent) => void;
  signal: AbortSignal;
}) {
  // Created per request so a missing key surfaces as a readable error in the
  // panel rather than crashing the module.
  const client = new Anthropic();

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((turn) => ({ role: turn.role, content: turn.text })),
    { role: "user", content: message },
  ];

  let wroteText = false;
  let jsonRetries = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        // Opus 5.5 defaults to medium; set explicitly so a model change can't
        // silently change it. Filing and answering rarely need more.
        output_config: { effort: "medium" },
        // If a safety classifier declines, retry on the model Anthropic
        // recommends for that case instead of failing the turn.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          { type: "text", text: contextBlock(scope, snapshot) },
        ],
        tools: TOOLS,
        messages,
      },
      { signal }
    );

    let firstDelta = true;
    stream.on("text", (delta) => {
      // Separate this step's reply from text written before the tool calls.
      if (firstDelta && wroteText) send({ type: "text", text: "\n\n" });
      firstDelta = false;
      wroteText = true;
      send({ type: "text", text: delta });
    });

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await stream.finalMessage();
      jsonRetries = 0;
    } catch (error) {
      // Only a tool input that couldn't be parsed at all is worth one retry;
      // API errors (auth, rate limit, server) go straight to the user.
      if (error instanceof Anthropic.APIError || signal.aborted || jsonRetries++ >= 1) throw error;
      continue;
    }

    if (response.stop_reason === "refusal") {
      send({ type: "error", message: "The assistant couldn't help with that request. Try rephrasing it." });
      return;
    }

    const toolUses = response.content.filter(
      (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use"
    );
    if (toolUses.length === 0) return; // finished: a plain reply or end of turn

    if (response.stop_reason === "max_tokens") {
      // A tool input cut off mid-way can still parse; never show it.
      send({ type: "error", message: "The reply was too long to finish. Try sending less text at once." });
      return;
    }

    messages.push({ role: "assistant", content: response.content });

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((tool) => {
      const check = checkProposal(tool.id, tool.name, tool.input, snapshot);
      if (!check.ok) {
        return { type: "tool_result", tool_use_id: tool.id, is_error: true, content: check.error };
      }
      send({ type: "proposal", proposal: check.proposal });
      return { type: "tool_result", tool_use_id: tool.id, content: TOOL_RESULT_SHOWN };
    });

    messages.push({ role: "user", content: results });
  }
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "The assistant couldn't sign in to the Claude API. Check ANTHROPIC_API_KEY.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "The assistant is busy right now. Try again in a minute.";
  }
  if (error instanceof Anthropic.APIError) {
    return `The assistant hit an error (${error.status ?? "network"}). Try again.`;
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return "The assistant isn't connected yet. Add ANTHROPIC_API_KEY to .env.local (and to your Vercel project), then restart the server.";
  }
  return "The assistant hit an unexpected error. Try again.";
}
