/**
 * Decisions — the model behind the decision log.
 *
 * A decision record is the unit the timeline renders. `extractDecision` is the
 * prototype's stand-in for the AI: it reads whatever the user pasted or typed
 * and either drafts a record or asks for the one thing it's missing. Swapping in
 * a real model means replacing that one function with a call to an API route —
 * the shape it returns is what the rest of the page is built against.
 */

export const DECISION_STATUSES = [
  "proposed",
  "decided",
  "revisited",
  "reversed",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_STATUS_LABEL: Record<DecisionStatus, string> = {
  proposed: "Proposed",
  decided: "Decided",
  revisited: "Revisited",
  reversed: "Reversed",
};

export const DECISION_IMPACTS = ["low", "medium", "high"] as const;
export type DecisionImpact = (typeof DECISION_IMPACTS)[number];

export type DecisionConfidence = "low" | "medium" | "high";

export const DECISION_SOURCES = [
  "transcript",
  "meeting-notes",
  "document",
  "chat",
] as const;
export type DecisionSource = (typeof DECISION_SOURCES)[number];

export const DECISION_SOURCE_LABEL: Record<DecisionSource, string> = {
  transcript: "Call transcript",
  "meeting-notes": "Meeting notes",
  document: "Document",
  chat: "Chat",
};

/** The record as drafted, before the user accepts it onto the timeline. */
export type DecisionDraft = {
  title: string;
  /** What was decided, in one or two sentences. */
  decision: string;
  /** The situation that forced the choice. */
  context: string;
  /** Why this option won. Empty when the source never says. */
  rationale: string;
  /** Options considered and not taken. */
  alternatives: string[];
  /** What the decision commits the team to. */
  consequences: string[];
  /** Empty when nobody is named — the extractor never invents a name. */
  owner: string;
  stakeholders: string[];
  status: DecisionStatus;
  impact: DecisionImpact;
  /** YYYY-MM-DD. */
  decidedOn: string;
  tags: string[];
  /** How well the source actually supports the record. */
  confidence: DecisionConfidence;
  source: DecisionSource;
};

export type Decision = DecisionDraft & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Turns an accepted draft into a record on the timeline. */
export function toDecision(draft: DecisionDraft): Decision {
  const ts = Date.now();
  return { ...draft, id: crypto.randomUUID(), createdAt: ts, updatedAt: ts };
}

/** Newest first — the order the timeline reads in. */
export function byDateDesc(a: Decision, b: Decision): number {
  return b.decidedOn.localeCompare(a.decidedOn) || b.createdAt - a.createdAt;
}

/** Groups records under a "August 2026" style heading for the timeline. */
export function groupByMonth(
  decisions: Decision[]
): { key: string; label: string; decisions: Decision[] }[] {
  const groups = new Map<string, Decision[]>();
  for (const decision of decisions) {
    const key = decision.decidedOn.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(decision);
    else groups.set(key, [decision]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    decisions: items,
  }));
}

export function matchesQuery(decision: Decision, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    decision.title,
    decision.decision,
    decision.context,
    decision.rationale,
    decision.owner,
    ...decision.stakeholders,
    ...decision.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

/* -------------------------------------------------------------------------- */
/* Extraction (prototype)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * What one turn of the assistant produces: either a drafted record for the user
 * to accept, or a question because the material didn't contain a decision.
 */
export type ExtractionResult = {
  /** The assistant's prose reply, shown in the chat. */
  reply: string;
  /** Present only when the material supported a record. */
  draft: DecisionDraft | null;
};

const DECISION_CUES =
  /\b(we(?:'ll| will| are going to| decided| agreed| should)|let'?s (?:go with|do|ship)|decision is|going with|agreed to|signed off|the call is|i'?m calling it)\b/i;
const ALTERNATIVE_CUES =
  /\b(instead of|rather than|we considered|considered|the other option|alternative|ruled out|rejected|we could have|option [ab1-9])\b/i;
const RATIONALE_CUES =
  /\b(because|since|the reason|given that|driven by|due to|that way|so that)\b/i;
const CONSEQUENCE_CUES =
  /\b(needs? to|need to|has to|have to|follow[- ]up|next step|blocked|migration|before we|action item|owns?)\b/i;
const PROPOSED_CUES =
  /\b(propose|proposal|recommend|suggest|pending|awaiting|sign[- ]off|needs approval|tentative)\b/i;
const REVERSED_CUES = /\b(revert|reverse|undo|back out|rolling back|cancel)\b/i;
const REVISITED_CUES =
  /\b(revisit|reopen|changing our|earlier decision|previously decided|we said before)\b/i;
const HIGH_IMPACT_CUES =
  /\b(strategy|strategic|roadmap|architecture|pricing|rewrite|platform|quarter|company|headcount|budget|migrate)\b/i;
const LOW_IMPACT_CUES = /\b(copy|wording|label|colou?r|icon|typo|naming)\b/i;

/**
 * Keyword → tag, in priority order; the first three matches win.
 *
 * Every alternation is grouped and boundaried on purpose — an unparenthesised
 * `\bdesign|ux|ui` binds the boundary to the first branch only, so a bare "ui"
 * starts matching inside words like "arguing".
 */
const TAG_RULES: [RegExp, string][] = [
  [/\b(?:pric(?:e|es|ing)|tiers?|packaging|billing|revenue|discount)\b/i, "pricing"],
  [
    /\b(?:onboard(?:ing)?|activation|sign[- ]?ups?|trial|conversion|funnel)\b/i,
    "onboarding",
  ],
  [/\b(?:roadmap|quarters?|prioriti[sz]\w*|scope|defer|timeline)\b/i, "roadmap"],
  [/\b(?:mobile|ios|android|app store)\b/i, "mobile"],
  [/\b(?:sso|saml|scim|security|compliance|soc ?2|privacy)\b/i, "security"],
  [/\b(?:enterprise|procurement|contracts?|deals?|renewals?)\b/i, "enterprise"],
  [
    /\b(?:architecture|refactor|tech debt|migrations?|infra\w*|database)\b/i,
    "architecture",
  ],
  [/\b(?:hir(?:e|ing)|headcount|resourcing|capacity|staffing)\b/i, "resourcing"],
  [/\b(?:experiments?|a\/b|hypothes[ie]s|metrics?|guardrail)\b/i, "experimentation"],
  [/\b(?:design|ux|ui|usability|research|prototype)\b/i, "design"],
  [/\b(?:support|churn|retention|customers?|nps)\b/i, "customers"],
];

type Line = {
  /** The sentence with any speaker label stripped off. */
  text: string;
  /** The speaker, when the line was labelled "Name: ...". */
  speaker: string | null;
};

const SPEAKER = /^\s*([A-Z][\w.'-]*(?: [A-Z][\w.'-]*){0,2})\s*:\s*(.+)$/;

/**
 * Splits raw material into sentences, keeping track of who said what. Handles
 * both transcript form ("Priya: we'll ship it") and free prose.
 */
function toLines(input: string): Line[] {
  const lines: Line[] = [];
  for (const rawLine of input.split(/\r?\n+/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const labelled = SPEAKER.exec(trimmed);
    const speaker = labelled ? labelled[1] : null;
    const body = labelled ? labelled[2] : trimmed;

    for (const sentence of body.split(/(?<=[.!?])\s+/)) {
      const text = sentence.trim().replace(/^[-*•]\s*/, "");
      if (text) lines.push({ text, speaker });
    }
  }
  return lines;
}

function firstMatch(lines: Line[], cue: RegExp): Line | null {
  // Prefer a substantial sentence: short cue matches are usually filler.
  const matches = lines.filter((line) => cue.test(line.text));
  return (
    matches.find((line) => line.text.length >= 40) ?? matches[0] ?? null
  );
}

/** Discourse markers that open a spoken sentence and add nothing to a record. */
const LEAD_IN = /^(?:so|okay|ok|right|well|yeah|yes|no|and|but|then|i mean|look)\b[\s,:;—-]*/i;

function sentenceCase(text: string): string {
  const clean = text
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEAD_IN, "")
    .replace(LEAD_IN, "")
    .replace(/[,;:]$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** A complete sentence, so joined fragments don't run together. */
function asSentence(text: string): string {
  const clean = sentenceCase(text);
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function asTitle(text: string, max: number): string {
  return truncate(sentenceCase(text).replace(/\.$/, ""), max);
}

/** Trims to a word boundary so titles don't end mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const boundary = cut.lastIndexOf(" ");
  return `${cut.slice(0, boundary > max * 0.6 ? boundary : max).trimEnd()}…`;
}

/**
 * Read from the decision sentence first: a stray "I'd suggest" later in the
 * transcript shouldn't demote a call that was clearly settled. Only the two
 * cues that describe a decision's relationship to an earlier one are worth
 * scanning the whole input for.
 */
/** Cues that introduce a justification inside a decision sentence. */
const RATIONALE_SPLIT =
  /\b(?:because|since|given that|due to|so that|that way|the reason)\b/i;

/**
 * Splits "we'll do X because Y" into the choice and the reasoning. Guarded on
 * position: a sentence that opens with "Because…" is all reasoning and has no
 * choice to separate out.
 */
function splitRationale(text: string): { decision: string; rationale: string } {
  const match = RATIONALE_SPLIT.exec(text);
  if (!match || match.index < 25) return { decision: text, rationale: "" };
  return {
    decision: text.slice(0, match.index).trim().replace(/[,;:—-]$/, ""),
    rationale: text.slice(match.index),
  };
}

function pickStatus(decisionText: string, input: string): DecisionStatus {
  if (REVERSED_CUES.test(decisionText)) return "reversed";
  if (REVISITED_CUES.test(input)) return "revisited";
  if (PROPOSED_CUES.test(decisionText)) return "proposed";
  return "decided";
}

function pickImpact(input: string): DecisionImpact {
  if (HIGH_IMPACT_CUES.test(input)) return "high";
  if (LOW_IMPACT_CUES.test(input) || input.length < 200) return "low";
  return "medium";
}

function pickTags(input: string): string[] {
  const tags = TAG_RULES.filter(([cue]) => cue.test(input)).map(
    ([, tag]) => tag
  );
  return tags.length ? tags.slice(0, 3) : ["general"];
}

function pickSource(input: string, lines: Line[]): DecisionSource {
  const labelled = lines.filter((line) => line.speaker).length;
  if (labelled >= 3) return "transcript";
  if (labelled >= 1 || /^\s*[-*•]/m.test(input)) return "meeting-notes";
  return input.length > 600 ? "document" : "chat";
}

function collect(
  lines: Line[],
  cue: RegExp,
  limit: number,
  skip: (Line | null)[] = []
): string[] {
  return lines
    .filter((line) => !skip.includes(line) && cue.test(line.text))
    .map((line) => asSentence(line.text))
    .filter((text, index, all) => all.indexOf(text) === index)
    .slice(0, limit);
}

/**
 * The prototype's assistant. A real implementation would send the conversation
 * to Claude and let it decide between drafting and asking — this reads the same
 * signals with regexes so the page can be demonstrated end to end without a
 * model behind it.
 */
export function extractDecision(
  input: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): ExtractionResult {
  const lines = toLines(input);
  const decisionLine = firstMatch(lines, DECISION_CUES);

  if (!decisionLine) {
    return { reply: askForMore(input, lines, history), draft: null };
  }

  const decisionIndex = lines.indexOf(decisionLine);
  const inline = splitRationale(decisionLine.text);
  const decision = asSentence(inline.decision);

  // Whatever was said before the decision is the situation that led to it.
  const context = lines
    .slice(Math.max(0, decisionIndex - 2), decisionIndex)
    .map((line) => asSentence(line.text))
    .join(" ");

  const speakers = [
    ...new Set(lines.map((line) => line.speaker).filter((s): s is string => !!s)),
  ];
  const owner = decisionLine.speaker ?? speakers[0] ?? "";

  // The reasoning is either inside the decision sentence or in a nearby one.
  const rationaleLine = inline.rationale ? null : firstMatch(lines, RATIONALE_CUES);
  const rationale = inline.rationale
    ? asSentence(inline.rationale)
    : rationaleLine && rationaleLine !== decisionLine
      ? asSentence(rationaleLine.text)
      : "";

  // A line already used as the rationale mustn't reappear as an alternative.
  const used = [decisionLine, rationaleLine];
  const alternatives = collect(lines, ALTERNATIVE_CUES, 3, used);
  const consequences = collect(
    lines.slice(decisionIndex),
    CONSEQUENCE_CUES,
    3,
    used
  );

  const draft: DecisionDraft = {
    title: asTitle(inline.decision, 72),
    decision,
    context:
      context ||
      "Captured from the conversation without a stated background — worth filling in before this record is shared.",
    rationale,
    alternatives,
    consequences,
    owner,
    stakeholders: speakers.filter((name) => name !== owner).slice(0, 4),
    status: pickStatus(inline.decision, input),
    impact: pickImpact(input),
    decidedOn: today(),
    tags: pickTags(input),
    confidence: pickConfidence(input, rationale, context),
    source: pickSource(input, lines),
  };

  return { reply: describeDraft(draft), draft };
}

function pickConfidence(
  input: string,
  rationale: string,
  context: string
): DecisionConfidence {
  if (rationale && context && input.length > 400) return "high";
  if (!rationale || input.length < 160) return "low";
  return "medium";
}

const DEMO_NOTE =
  "(Prototype — this record was pulled out with pattern matching, not a model. Wire the chat up to the Claude API for real extraction.)";

function describeDraft(draft: DecisionDraft): string {
  const gaps: string[] = [];
  if (!draft.rationale) gaps.push("why this option won");
  if (!draft.alternatives.length) gaps.push("what else was considered");
  if (!draft.owner) gaps.push("who owns it");

  const gapNote = gaps.length
    ? ` I couldn't find ${gaps.join(", ")} — ${gaps.length > 1 ? "those fields are" : "that field is"} left blank rather than guessed.`
    : " Every field was supported by the material.";

  return `Drafted a decision: “${draft.title}”.${gapNote}\n\nReview it below and save it to the timeline, or tell me what to change.\n\n${DEMO_NOTE}`;
}

/**
 * The other branch: no decision in the material, so ask for the single most
 * useful missing thing rather than guessing a record into existence.
 */
function askForMore(
  input: string,
  lines: Line[],
  history: { role: "user" | "assistant"; content: string }[]
): string {
  const asked = history.filter((turn) => turn.role === "assistant").length;

  if (input.trim().length < 40) {
    return `That's not quite enough to record a decision. Paste the transcript or the notes, or tell me what was decided and why.\n\n${DEMO_NOTE}`;
  }

  if (lines.length > 6) {
    return `I read through that, but I couldn't find a point where a choice was actually settled — it reads as discussion rather than a decision.\n\nWhat did you land on?\n\n${DEMO_NOTE}`;
  }

  if (asked > 0) {
    return `Still nothing I'd call a decision in there. The one thing I need is the choice itself: what are you doing, and what are you not doing as a result?\n\n${DEMO_NOTE}`;
  }

  return `There's context there but no decision I can pin down. What was the call — and was it settled, or is it still a proposal?\n\n${DEMO_NOTE}`;
}
