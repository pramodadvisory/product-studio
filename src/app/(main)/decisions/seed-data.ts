import type { Decision } from "./decisions";

/**
 * Seed decisions, so the timeline shows what a filled decision log looks like
 * on a first visit. Written to localStorage once and then owned by the user —
 * see `useDecisions`.
 */
const DAY = 1000 * 60 * 60 * 24;

function daysAgo(n: number): { iso: string; ts: number } {
  const ts = Date.now() - n * DAY;
  return { iso: new Date(ts).toISOString().slice(0, 10), ts };
}

function seed(
  id: string,
  days: number,
  fields: Omit<Decision, "id" | "decidedOn" | "createdAt" | "updatedAt">
): Decision {
  const { iso, ts } = daysAgo(days);
  return { ...fields, id, decidedOn: iso, createdAt: ts, updatedAt: ts };
}

export const SEED_DECISIONS: Decision[] = [
  seed("seed-pricing-tiers", 2, {
    title: "Collapse the four pricing tiers into Starter, Team and Enterprise",
    decision:
      "We are replacing the four current plans with three — Starter, Team and Enterprise — and folding the Pro tier's seat-based add-ons into Team.",
    context:
      "Sales reported that Pro and Business were being confused in almost every call, and the pricing page had the steepest drop-off in the funnel. Between them those two tiers accounted for 8% of revenue.",
    rationale:
      "Three tiers map onto the three buyer types we actually see, and folding in the add-ons removes the negotiation that was slowing deals down. The revenue at risk from retiring the thin tiers is small enough to absorb.",
    alternatives: [
      "Keep four tiers and rewrite the pricing page copy — rejected because the confusion was structural, not editorial.",
      "Move to usage-based pricing — rejected as too large a change to land this quarter.",
    ],
    consequences: [
      "Existing Pro and Business customers need a migration path and grandfathered pricing for 12 months.",
      "Pricing page, checkout and the billing service all need updating before launch.",
      "Sales needs new collateral and a short enablement session.",
    ],
    owner: "Priya Raman",
    stakeholders: ["Marcus Webb", "Dana Osei"],
    status: "decided",
    impact: "high",
    tags: ["pricing", "enterprise"],
    confidence: "high",
    source: "transcript",
  }),
  seed("seed-onboarding-checklist", 8, {
    title: "Replace the onboarding tour with an in-product checklist",
    decision:
      "The five-step modal tour is being removed in favour of a persistent checklist in the sidebar that tracks the same activation milestones.",
    context:
      "Only 22% of new workspaces finished the tour, and session recordings showed most users dismissing the first modal within two seconds. Activation has been flat for two quarters.",
    rationale:
      "A checklist lets people activate in their own order and at their own pace, and it stays available after the first session — which is when most workspaces actually get set up.",
    alternatives: [
      "Shorten the tour to three steps — rejected because dismissal happened at step one, so length was not the problem.",
      "Trigger the tour on second login — rejected as an untested guess with the same interruption cost.",
    ],
    consequences: [
      "Needs a new activation event schema before the change can be measured.",
      "The tour component can be deleted once the checklist ships behind a flag.",
    ],
    owner: "Dana Osei",
    stakeholders: ["Priya Raman"],
    status: "decided",
    impact: "medium",
    tags: ["onboarding", "design"],
    confidence: "high",
    source: "meeting-notes",
  }),
  seed("seed-sso-scope", 15, {
    title: "Ship SAML SSO before SCIM provisioning",
    decision:
      "SAML SSO ships first as a standalone release; SCIM user provisioning follows in a second release rather than the two shipping together.",
    context:
      "Three enterprise deals are blocked on SSO. The original plan bundled SSO and SCIM into one release, which pushed the date past two of those deals' decision dates.",
    rationale:
      "SSO alone unblocks the deals — none of the three named SCIM as a requirement — and splitting the release pulls the unblocking date forward by about six weeks.",
    alternatives: [
      "Ship both together as planned — rejected because it misses two deal deadlines.",
      "Ship SCIM first — rejected as nothing is blocked on it.",
    ],
    consequences: [
      "Manual user management stays a known gap for the first release; support needs a documented workaround.",
    ],
    owner: "Sam Iqbal",
    stakeholders: ["Marcus Webb"],
    status: "revisited",
    impact: "medium",
    tags: ["security", "enterprise", "roadmap"],
    confidence: "high",
    source: "chat",
  }),
  seed("seed-mobile-defer", 23, {
    title: "Defer the native mobile app to next year",
    decision:
      "Native iOS and Android apps are off the roadmap this year. We will invest in the responsive web experience instead and revisit native in January.",
    context:
      "Mobile came up in every enterprise deal review, but the team has no mobile engineers and hiring two would consume most of the remaining headcount budget.",
    rationale:
      "Analytics show 9% of sessions are on mobile and almost all of them are read-only — checking status rather than doing work. Responsive web covers that at a fraction of the cost.",
    alternatives: [
      "Ship a React Native wrapper — rejected because a read-only use case doesn't justify a second runtime to maintain.",
      "Hire two mobile engineers now — rejected on budget; it would displace the platform work.",
    ],
    consequences: [
      "Sales needs a clear answer for the mobile question in enterprise deals.",
      "Responsive gaps in the dashboard and story map need an audit and a fix list.",
    ],
    owner: "Marcus Webb",
    stakeholders: ["Priya Raman", "Sam Iqbal"],
    status: "decided",
    impact: "high",
    tags: ["roadmap", "mobile", "resourcing"],
    confidence: "medium",
    source: "transcript",
  }),
  seed("seed-trial-length", 34, {
    title: "Cut the free trial from 30 days to 14",
    decision:
      "New signups get a 14-day trial. Anyone mid-trial keeps their original 30 days.",
    context:
      "Median time-to-first-value is four days, but median time-to-conversion sat at day 26 — most of the trial was dead air, and sales couldn't tell an evaluating account from a dormant one.",
    rationale:
      "A shorter window concentrates the evaluation into the period where users are actually active, and gives sales a usable signal for when to reach out.",
    alternatives: [
      "Keep 30 days and add nudge emails — considered, and held back as the fallback if conversion drops.",
    ],
    consequences: [
      "Needs a conversion-rate guardrail; we revert if it drops more than 15% over six weeks.",
    ],
    owner: "Priya Raman",
    stakeholders: ["Dana Osei"],
    status: "proposed",
    impact: "medium",
    tags: ["pricing", "onboarding", "experimentation"],
    confidence: "medium",
    source: "meeting-notes",
  }),
];
