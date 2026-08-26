// Seed content for the Tasks board. Ids are literals (not generated) so the
// first render is stable between server and client.

import type { TaskBoard } from "./tasks";

export const SEED_BOARD: TaskBoard = [
  {
    id: "hyp-pricing",
    title: "Pricing complexity is what stalls signups",
    belief:
      "We believe that prospects abandon at the pricing step because three tiers with overlapping features force a comparison they aren't equipped to make yet.",
    signal:
      "We'll know we're right when a single-tier pricing page lifts signup conversion by at least 15% without a drop in trial-to-paid.",
    status: "testing",
    confidence: 65,
    experiments: [
      {
        id: "exp-single-tier",
        title: "A/B test a single-tier pricing page",
        metric: "Signup conversion (pricing → account created)",
        target: "+15% relative lift, p < 0.05",
        startDate: "2026-08-10",
        endDate: "2026-09-07",
        status: "running",
        result: "",
        stories: [
          {
            id: "story-pricing-1",
            text: "Build variant B pricing page with one tier and a usage calculator",
            status: "done",
            priority: "high",
            storyPoints: 5,
            storyKey: "EXP-1",
            assignee: "Alice",
          },
          {
            id: "story-pricing-2",
            text: "Wire analytics events for pricing view, CTA click and signup",
            status: "done",
            priority: "high",
            storyPoints: 3,
            storyKey: "EXP-2",
            assignee: "Bob",
          },
          {
            id: "story-pricing-3",
            text: "Ship experiment to 50% of traffic behind a feature flag",
            status: "in-progress",
            priority: "high",
            storyPoints: 2,
            storyKey: "EXP-3",
            assignee: "Bob",
          },
          {
            id: "story-pricing-4",
            text: "Build the read-out dashboard with confidence intervals",
            status: "todo",
            priority: "medium",
            storyPoints: 3,
            storyKey: "EXP-4",
            assignee: "Charlie",
          },
        ],
      },
      {
        id: "exp-churn-interviews",
        title: "Interview 8 prospects who dropped at pricing",
        metric: "Stated reason for abandoning",
        target: "5 of 8 name tier confusion unprompted",
        startDate: "2026-08-18",
        endDate: "2026-08-29",
        status: "planned",
        result: "",
        stories: [
          {
            id: "story-interview-1",
            text: "Pull the list of sessions that bounced from /pricing last 30 days",
            status: "todo",
            priority: "medium",
            storyPoints: 1,
            storyKey: "EXP-5",
            assignee: "Dana",
          },
          {
            id: "story-interview-2",
            text: "Write the interview guide and screener",
            status: "todo",
            priority: "medium",
            storyPoints: 2,
            storyKey: "EXP-6",
            assignee: "Dana",
          },
          {
            id: "story-interview-3",
            text: "Run and transcribe 8 interviews",
            status: "blocked",
            priority: "low",
            storyPoints: 5,
            storyKey: "EXP-7",
          },
        ],
      },
    ],
  },
  {
    id: "hyp-onboarding",
    title: "Onboarding length drives first-week drop-off",
    belief:
      "We believe that new users churn in week one because onboarding asks for nine fields of setup before showing any value.",
    signal:
      "We'll know we're right when cutting onboarding to three fields raises day-7 retention above 40%.",
    status: "unvalidated",
    confidence: 40,
    experiments: [
      {
        id: "exp-short-onboarding",
        title: "Ship a three-field onboarding to new accounts",
        metric: "Day-7 retention",
        target: "40% (from 31% baseline)",
        startDate: "",
        endDate: "",
        status: "planned",
        result: "",
        stories: [
          {
            id: "story-onboarding-1",
            text: "Audit which onboarding fields are actually read downstream",
            status: "in-progress",
            priority: "high",
            storyPoints: 3,
            storyKey: "EXP-8",
            assignee: "Alice",
          },
          {
            id: "story-onboarding-2",
            text: "Move optional fields into a deferred settings prompt",
            status: "todo",
            priority: "medium",
            storyPoints: 5,
            storyKey: "EXP-9",
          },
        ],
      },
    ],
  },
  {
    id: "hyp-trial",
    title: "A 30-day trial buys us nothing over 14",
    belief:
      "We believe that trials longer than 14 days delay the buying decision rather than deepening evaluation, because usage flattens after day 9.",
    signal:
      "We'll know we're right when a 14-day trial holds trial-to-paid conversion flat while shortening time-to-close.",
    status: "validated",
    confidence: 85,
    experiments: [
      {
        id: "exp-trial-length",
        title: "Halve the trial for a 30% traffic cohort",
        metric: "Trial-to-paid conversion & median days to close",
        target: "Conversion within 2pts, close time down 10 days",
        startDate: "2026-06-01",
        endDate: "2026-07-15",
        status: "concluded",
        result:
          "Conversion held at 18.6% vs 18.9% control (within noise) and median time to close fell from 26 to 15 days. Shipping 14 days as the default; enterprise trials stay negotiable.",
        stories: [
          {
            id: "story-trial-1",
            text: "Make trial length configurable per cohort",
            status: "done",
            priority: "high",
            storyPoints: 5,
            storyKey: "EXP-10",
            assignee: "Bob",
          },
          {
            id: "story-trial-2",
            text: "Rewrite trial-expiry email sequence for the shorter window",
            status: "done",
            priority: "medium",
            storyPoints: 3,
            storyKey: "EXP-11",
            assignee: "Dana",
          },
          {
            id: "story-trial-3",
            text: "Write up the read-out and circulate to GTM",
            status: "done",
            priority: "low",
            storyPoints: 1,
            storyKey: "EXP-12",
            assignee: "Charlie",
          },
        ],
      },
    ],
  },
  {
    id: "hyp-referral",
    title: "A referral banner will drive organic growth",
    belief:
      "We believe that an in-app referral banner will produce a meaningful share of new signups because our NPS is high.",
    signal:
      "We'll know we're right when referrals account for 5% of new signups within a month.",
    status: "invalidated",
    confidence: 20,
    experiments: [
      {
        id: "exp-referral-banner",
        title: "Persistent referral banner in the app header",
        metric: "Share of signups attributed to a referral code",
        target: "5% of new signups",
        startDate: "2026-05-05",
        endDate: "2026-06-05",
        status: "concluded",
        result:
          "Referrals reached 0.4% of signups over a month, and the banner cost 1.2% CTR on the primary nav. Removed. High NPS did not translate into an incentive to share.",
        stories: [
          {
            id: "story-referral-1",
            text: "Build referral code generation and attribution",
            status: "done",
            priority: "medium",
            storyPoints: 5,
            storyKey: "EXP-13",
            assignee: "Bob",
          },
          {
            id: "story-referral-2",
            text: "Add the header banner behind a flag",
            status: "done",
            priority: "low",
            storyPoints: 2,
            storyKey: "EXP-14",
            assignee: "Alice",
          },
          {
            id: "story-referral-3",
            text: "Roll the banner back and archive the flag",
            status: "done",
            priority: "low",
            storyPoints: 1,
            storyKey: "EXP-15",
            assignee: "Alice",
          },
        ],
      },
    ],
  },
];
