/**
 * The questions that fill Discover and Define.
 *
 * Product Studio is for people who may never have built a great product, so
 * each question teaches while it asks: why it matters, what a good answer
 * contains, and a worked example. Every example follows the same imaginary
 * product (EXAMPLE_PRODUCT) so a first-timer sees one story built up stage by
 * stage.
 *
 * Each question is answered by one Product Board block; the answer is that
 * block's content. The question flow and the stage report read and write the
 * same block, so nothing is entered twice. A stage is complete when every one
 * of its questions has an answer (`isAnswered`); answers that are still
 * assumptions stay flagged but don't hold the stage back.
 *
 * Order matters: questions run in the order a good product person would think
 * them through, and follow the section order in `src/lib/navigation.ts`.
 */
import { STAGES, type StageId } from "@/lib/navigation";
import type { Block, Board } from "@/lib/product-board/schema";
import { findBlock } from "@/lib/product-board/view";

export type Question = {
  /** Stable id, used in URLs: /discover/answer?q=icp */
  id: string;
  stageId: StageId;
  /** The stage page (report section) whose block holds the answer. */
  section: string;
  blockId: string;
  /** The question, in plain words. */
  prompt: string;
  /** Why it matters, for someone doing this for the first time. */
  why: string;
  /** What a good answer contains. */
  good: string[];
  /** A worked example: one paragraph, or one line per item. */
  example: string | string[];
};

export const EXAMPLE_PRODUCT = "a booking and reminder app for small physiotherapy clinics";

export const QUESTIONS: Question[] = [
  // ─────────────────────────────────────────── Discover › Customers & pain points
  {
    id: "icp",
    stageId: "discover",
    section: "customers",
    blockId: "b-icp",
    prompt: "Which kind of customer is this for, and which is it not for?",
    why: "Everything after this depends on it. A product for everyone ends up useful to no one. This is the type of business or household you're aiming at, the one that would pay. The people inside it who use the product come a couple of questions later.",
    good: [
      "Names one specific kind of customer, not \"businesses\" or \"users\"",
      "Says what situation they're in that makes them need this",
      "Says who it is not for, and why",
    ],
    example:
      "Small, owner-run physiotherapy clinics that still take bookings by phone and a paper diary. Not hospital physio departments or large chains, which already have booking systems.",
  },
  {
    id: "firmographics",
    stageId: "discover",
    section: "customers",
    blockId: "b-firmographics",
    prompt: "What facts describe a typical customer?",
    why: "These are the filters for finding more customers like your best ones, and for spotting a poor fit before you spend weeks selling to it.",
    good: [
      "Ranges rather than single numbers",
      "Covers size, location and anything that predicts whether they'll buy",
      "Rows that don't fit your customers are removed or renamed",
    ],
    example: [
      "Company size: 2 to 10 practitioners",
      "Annual revenue: £150K to £1M",
      "Geography: UK, outside the cities the big chains cover",
      "Current tools: paper diary or a shared spreadsheet",
    ],
  },
  {
    id: "personas",
    stageId: "discover",
    section: "customers",
    blockId: "b-personas",
    prompt: "Inside those customers, which people will use it every day, and what are they trying to get done?",
    why: "The customer is an organisation or a group; the users are individual people with a job to do. Products get used, not just bought, when they're designed for the person doing the work. If people buy this for themselves, describe one or two typical buyers here as individuals.",
    good: [
      "One or two named people with a role, not a group",
      "What they're trying to get done, in their own words",
      "What gets in their way today",
    ],
    example: [
      "Priya, clinic owner: answers the phone between patients and loses bookings when she can't pick up",
      "Tom, physiotherapist: wants the day's list and patient notes on his phone before the first appointment",
    ],
  },
  {
    id: "decision-makers",
    stageId: "discover",
    section: "customers",
    blockId: "b-decision-makers",
    prompt: "Who decides whether to buy it, and what does each of them care about?",
    why: "A product can delight its users and still never get bought. Knowing who signs off, who can block the purchase and what each needs to hear is how a sale closes.",
    good: [
      "Every role that can say yes or no",
      "How much say each one has",
      "The one concern each must have answered",
    ],
    example: [
      "Clinic owner (final say): will it pay for itself through fewer missed appointments?",
      "Practice manager (strong influence): can the front desk learn it in an afternoon?",
    ],
  },
  {
    id: "pains",
    stageId: "discover",
    section: "customers",
    blockId: "b-pains",
    prompt: "What are the biggest problems these customers have today?",
    why: "Pain is what makes people change. If a problem isn't painful and frequent, people won't switch from what they do now, however good your product is.",
    good: [
      "Each pain is specific and observable, not \"inefficiency\"",
      "Rated by how much it hurts (High, Medium or Low)",
      "Comes from talking to customers, not from guessing",
    ],
    example: [
      "Missed appointments (High): about 1 in 8 patients don't turn up, costing a 4-person clinic around £2,000 a month",
      "Phone tag (Medium): the front desk spends an hour a day returning calls to book",
    ],
  },
  {
    id: "behaviours",
    stageId: "discover",
    section: "customers",
    blockId: "b-behaviors",
    prompt: "How do they cope with these problems today?",
    why: "Your real competitor is often a spreadsheet, a habit or doing nothing. The workaround tells you what you have to beat, and what customers already put up with.",
    good: [
      "What people actually do, not what they should do",
      "The cost of it in time, money or mistakes",
      "Any tools they already pay for",
    ],
    example: [
      "A paper diary at reception, copied into a spreadsheet at the end of the day",
      "Reminder texts sent by hand from the owner's phone",
      "Some tried a general booking app and gave up within a month",
    ],
  },

  // ─────────────────────────────────────────── Discover › Market & competitors
  {
    id: "market-size",
    stageId: "discover",
    section: "market",
    blockId: "b-market-size",
    prompt: "How big is the opportunity?",
    why: "Sizing tells you whether the problem can support a business, and how much of the market you need to win. Sponsors and investors ask for it first.",
    good: [
      "TAM: everyone who could buy it. SAM: the part you can reach. SOM: what you can realistically win in 3 years",
      "Shows how each number was worked out",
      "Built bottom-up from customer counts and price, not taken from a report",
    ],
    example: [
      "TAM: £60M (7,500 UK clinics × £8K a year)",
      "SAM: £24M (3,000 independent clinics in regions you can reach)",
      "SOM: £1.2M (150 clinics in 3 years)",
    ],
  },
  {
    id: "trends",
    stageId: "discover",
    section: "market",
    blockId: "b-trends",
    prompt: "What is changing that makes now the right time?",
    why: "Good timing makes adoption much easier. A shift in technology, regulation or behaviour is often why an idea that failed before can work now.",
    good: [
      "Each trend is a real change you can point to",
      "Says how it helps this product",
      "Recent changes, not facts that have always been true",
    ],
    example: [
      "Patients now expect to book online, the way they book a haircut",
      "Long NHS waiting lists are sending more people to private physio",
      "Text and WhatsApp messages now cost almost nothing to send",
    ],
  },
  {
    id: "gaps",
    stageId: "discover",
    section: "market",
    blockId: "b-gaps",
    prompt: "What do existing products fail to do for these customers?",
    why: "A gap is where you can win without fighting the market leaders head-on. If there's no gap, you need a much stronger reason to exist.",
    good: [
      "Specific to your customer, not a general complaint",
      "Says why existing products leave it unsolved",
      "Something customers have told you or shown you",
    ],
    example: [
      "The big booking platforms are priced for chains, not 3-person clinics",
      "None handle how physio works: an assessment first, then a course of 6 sessions",
    ],
  },
  {
    id: "competitors",
    stageId: "discover",
    section: "market",
    blockId: "b-competitors",
    prompt: "Who else solves this problem, and why would someone choose you instead?",
    why: "Customers compare you with the alternatives whether you do or not. Knowing them, including doing nothing, keeps your claims honest and your edge clear.",
    good: [
      "Includes indirect options, such as spreadsheets or doing nothing",
      "Fair about what each one does well",
      "One clear reason someone would switch to you",
    ],
    example: [
      "Large booking platform: strong brand, but expensive and built for chains. Our edge: a third of the price, set up in a day",
      "Paper diary: free and familiar, but bookings get lost. Our edge: patients book themselves in the evening",
    ],
  },
  {
    id: "positioning",
    stageId: "discover",
    section: "market",
    blockId: "b-positioning",
    prompt: "In one sentence, how do you want customers to think of you?",
    why: "Positioning is the frame every message, web page and pitch uses. Without it, everyone on the team describes the product differently.",
    good: [
      "Names the customer and the kind of product",
      "States the one main benefit",
      "Says what sets you apart from the obvious alternative",
    ],
    example:
      "For independent physio clinics, the booking app that halves no-shows, without the cost and setup of the platforms built for chains.",
  },
  {
    id: "channels",
    stageId: "discover",
    section: "market",
    blockId: "b-gtm",
    prompt: "How will customers first hear about it and try it?",
    why: "A great product nobody finds fails just the same. Choosing one or two channels early stops you spreading effort everywhere and learning nothing.",
    good: [
      "Places these customers already spend time",
      "How someone goes from hearing about it to trying it",
      "One or two channels to start, not ten",
    ],
    example: [
      "A partnership with the physiotherapy association, with a member discount",
      "A free 30-day trial, set up on a 20-minute call",
      "Referrals: a free month for each clinic referred",
    ],
  },
  {
    id: "segments",
    stageId: "discover",
    section: "market",
    blockId: "b-segments",
    prompt: "Which group of customers will you win first?",
    why: "You can't win everyone at once. Starting with the group that feels the pain most and can say yes quickly gives you early proof and references.",
    good: [
      "One first group, with the others later",
      "Says why this group goes first",
      "Small enough to reach directly",
    ],
    example: [
      "First: owner-run clinics in the South East, with the highest no-show rates and the easiest to reach",
      "Next: sports injury clinics",
      "Later: physio groups with several sites",
    ],
  },

  // ─────────────────────────────────────────── Define › Value proposition & solution
  {
    id: "value-proposition",
    stageId: "define",
    section: "solution",
    blockId: "b-valueprop",
    prompt: "What is the one promise you're making to customers?",
    why: "The value proposition is what you ask a buyer to believe. Every feature should help keep this promise; anything that doesn't is a candidate to cut.",
    good: [
      "One promise, in the customer's language",
      "A result they care about, not a feature",
      "Something you could prove or disprove",
    ],
    example:
      "Fill every appointment slot. Patients book and get reminded automatically, so a 4-person clinic recovers around £2,000 a month in missed sessions.",
  },
  {
    id: "vision",
    stageId: "define",
    section: "solution",
    blockId: "b-vision",
    prompt: "If this succeeds, what will be different in five years?",
    why: "The vision keeps the team pointed the same way when priorities compete. It explains why the work matters beyond this year's targets.",
    good: [
      "A change for customers, not your company's size",
      "Ambitious but believable",
      "Short enough to remember",
    ],
    example: "Every independent clinic runs as smoothly as the best-run chain, and no patient waits a week for a call back.",
  },
  {
    id: "mission",
    stageId: "define",
    section: "solution",
    blockId: "b-mission",
    prompt: "What does the team do, day to day, to get there?",
    why: "The mission turns the vision into work. It helps people decide what to do on an ordinary Tuesday.",
    good: ["Says what you do, and for whom", "Concrete enough to guide choices", "One or two sentences"],
    example:
      "We build the simplest booking and reminder tools for small clinics, and set each clinic up personally so it's running on day one.",
  },
  {
    id: "features",
    stageId: "define",
    section: "solution",
    blockId: "b-features",
    prompt: "What are the core features, in priority order?",
    why: "Putting a priority on every feature forces the hard choices early. First-time teams build too much; great teams ship the few things that keep the promise.",
    good: [
      "Each feature solves one of the pain points",
      "Ranked: P0 must ship, P1 should, P2 can wait",
      "Describes the value to the user, not how it's built",
    ],
    example: [
      "Online self-booking (P0): patients book any time without calling",
      "Automatic text reminders (P0): fewer no-shows",
      "Course packages (P1): book all 6 sessions at once",
    ],
  },
  {
    id: "jobs",
    stageId: "define",
    section: "solution",
    blockId: "b-jtbd",
    prompt: "What jobs are customers hiring this product to do?",
    why: "People don't want a booking system; they want a full diary and fewer awkward calls. Thinking in jobs keeps the team focused on outcomes, not features.",
    good: [
      "Written as \"When…, I want to…, so I can…\"",
      "Includes how people want to feel, such as in control",
      "Each job is something customers already do today, badly",
    ],
    example: [
      "When a patient cancels, I want the slot refilled automatically, so I don't lose the income",
      "When I start my day, I want to see who's coming and why, so I can prepare in two minutes",
    ],
  },

  // ─────────────────────────────────────────── Define › Experience & design
  {
    id: "users-context",
    stageId: "define",
    section: "experience",
    blockId: "b-ux-context",
    prompt: "Who will use it, on which devices, and in what situations?",
    why: "The same feature works differently on a phone between appointments than at a desk. This tells designers and engineers what to build for first.",
    good: [
      "Each type of user and the device they use",
      "Where and when they use it",
      "What else is competing for their attention",
    ],
    example:
      "Receptionists on a desktop at the front desk, interrupted constantly. Physios on their phones between sessions, one-handed. Patients on their phones, usually in the evening.",
  },
  {
    id: "journeys",
    stageId: "define",
    section: "experience",
    blockId: "b-ux-journeys",
    prompt: "Which journeys must be effortless?",
    why: "A few moments decide whether people keep using a product. Naming them tells the team where design effort pays off most.",
    good: [
      "Three to five journeys, each from start to finish",
      "A target for each, such as a time or a number of steps",
      "The first-time experience is one of them",
    ],
    example: [
      "A patient books a first appointment in under a minute, without creating an account",
      "A clinic goes from sign-up to its first online booking in one day",
      "A physio checks today's list in under 10 seconds",
    ],
  },
  {
    id: "principles",
    stageId: "define",
    section: "experience",
    blockId: "b-ux-principles",
    prompt: "What must the experience always feel like?",
    why: "Principles settle design arguments before they start. When two good options conflict, the principle decides.",
    good: [
      "Specific enough to rule something out",
      "Three to five, not a wish list",
      "Anyone on the team could apply them",
    ],
    example: [
      "Plain words: nothing a patient wouldn't say",
      "Never more than three taps to book",
      "Calm: no pop-ups or upsells in front of patients",
    ],
  },
  {
    id: "constraints",
    stageId: "define",
    section: "experience",
    blockId: "b-ux-constraints",
    prompt: "What design rules and limits must it follow?",
    why: "Accessibility, brand and legal rules discovered late force expensive rework. Writing them down now means the design works within them from the start.",
    good: [
      "An accessibility standard, such as WCAG 2.2 AA",
      "The brand or design system to follow",
      "Platforms, legal and data rules",
    ],
    example: [
      "WCAG 2.2 AA: many patients are older or recovering from injury",
      "Works in any phone browser; patients never download an app",
      "UK GDPR: health data stays in the UK",
    ],
  },

  // ─────────────────────────────────────────── Define › Business model
  {
    id: "unit-economics",
    stageId: "define",
    section: "business-model",
    blockId: "b-unit-economics",
    prompt: "How much does each customer pay, and what does it cost to win one?",
    why: "Unit economics show whether growth makes money or burns it. If winning a customer costs more than they'll ever pay, more customers make things worse.",
    good: [
      "ACV: what one customer pays in a year",
      "CAC: what it costs to win one customer",
      "Payback: the months until a customer has paid back their CAC",
    ],
    example: [
      "ACV: £1,800",
      "CAC: £600",
      "CAC payback: 4 months",
      "Net revenue retention: 105% (customers spend a little more each year)",
    ],
  },
  {
    id: "pricing",
    stageId: "define",
    section: "business-model",
    blockId: "b-pricing",
    prompt: "How will you price it?",
    why: "Price is part of the product. It decides who can buy, how fast you grow, and whether the numbers above add up.",
    good: [
      "Two or three tiers at most to start",
      "Each tier is for a clear type of customer",
      "The price follows the value customers get",
    ],
    example: [
      "Solo: £49 a month, 1 practitioner",
      "Clinic: £149 a month, up to 10 practitioners",
      "Group: custom price, several sites",
    ],
  },
  {
    id: "projections",
    stageId: "define",
    section: "business-model",
    blockId: "b-projections",
    prompt: "What will revenue and customers look like over the next three years?",
    why: "Projections turn the plan into numbers others can plan around: hiring, funding and targets. They also show which assumptions matter most.",
    good: [
      "One row per year",
      "Built from customer numbers × price, not a growth rate picked from the air",
      "Notes the main assumption behind each year",
    ],
    example: [
      "Year 1: £90K ARR, 50 clinics. Assumes the association partnership starts in the spring",
      "Year 2: £400K ARR, 200 clinics",
      "Year 3: £1.1M ARR, 550 clinics",
    ],
  },

  // ─────────────────────────────────────────── Define › Success targets
  {
    id: "success",
    stageId: "define",
    section: "targets",
    blockId: "b-success",
    prompt: "In plain words, what will tell you this is working?",
    why: "Agreeing what success looks like before you build stops the goalposts moving later, and stops a launch counting as a success just because it shipped.",
    good: [
      "Describes what customers do, not what the team does",
      "Has a number and a time frame",
      "Anyone could check it without an argument",
    ],
    example: [
      "New clinics take their first online booking within 7 days",
      "No-shows at customer clinics fall by 40% within 3 months",
      "8 in 10 clinics are still active after 6 months",
    ],
  },
  {
    id: "kpis",
    stageId: "define",
    section: "targets",
    blockId: "b-kpis",
    prompt: "Which numbers will you track, and what are the targets?",
    why: "KPIs are the few numbers the team checks every week. With too many, nobody watches any of them.",
    good: [
      "Four to six numbers at most",
      "A target for each",
      "At least one about customers getting value, not only revenue",
    ],
    example: [
      "Active clinics: 150 by the end of year 1",
      "Monthly customer retention: 97%+",
      "Share of bookings made online: 60%+",
      "No-show rate at customer clinics: under 6%",
    ],
  },

  // ─────────────────────────────────────────── Define › Risks
  {
    id: "risks",
    stageId: "define",
    section: "risks",
    blockId: "b-risks",
    prompt: "What could stop this working, and what will you do about it?",
    why: "Every plan has risks. Naming them early, each with a plan, is the difference between a surprise and a setback you were ready for.",
    good: [
      "Covers customers, market, technology, money and people",
      "Rates the impact and probability of each",
      "Each has a concrete mitigation",
    ],
    example: [
      "Clinics won't trust online booking with health data (High impact, Medium probability): host in the UK, publish a clear privacy page, get the association's endorsement",
      "A large platform launches a cheap tier for small clinics (Medium, Medium): lock in partnerships and win on setup service",
    ],
  },
  {
    id: "opportunities",
    stageId: "define",
    section: "risks",
    blockId: "b-opportunities",
    prompt: "What upside could this unlock beyond the core plan?",
    why: "Knowing where the product could grow helps you make early choices that keep those doors open, without building for them yet.",
    good: [
      "Grounded in what you've learned about customers",
      "Says what would need to be true",
      "Kept apart from the core plan",
    ],
    example: [
      "Take payment at booking, for a small fee",
      "Sell to other therapy clinics, such as osteopaths and chiropractors",
    ],
  },
  {
    id: "growth",
    stageId: "define",
    section: "risks",
    blockId: "b-growth",
    prompt: "How will you grow after the first customers?",
    why: "The first customers usually come from hard work and personal contacts. A growth strategy explains where the next thousand will come from.",
    good: [
      "Builds on your first group of customers",
      "Each strategy names its channel or lever",
      "In the order you'll try them",
    ],
    example: [
      "Referral rewards between clinics",
      "Ireland next, then Australia, where clinics work the same way",
      "A self-serve plan with no setup call",
    ],
  },
];

export function questionsFor(stageId: StageId): Question[] {
  return QUESTIONS.filter((q) => q.stageId === stageId);
}

export function getQuestion(id: string | undefined): Question | undefined {
  return id ? QUESTIONS.find((q) => q.id === id) : undefined;
}

/** Whether a stage asks questions at all (Discover and Define). */
export function asksQuestions(stageId: StageId): boolean {
  return Boolean(STAGES.find((s) => s.id === stageId)?.report);
}

const filled = (value: string | undefined) => {
  const v = value?.trim();
  return Boolean(v && v !== "—");
};

/**
 * Whether a block holds an answer. Metrics need every row filled in (remove
 * rows that don't apply); lists and records need at least one entry.
 */
export function isAnswered(block: Block | undefined): boolean {
  if (!block) return false;
  switch (block.type) {
    case "statement":
      return filled(block.body);
    case "metrics":
      return block.items.length > 0 && block.items.every((item) => filled(item.value));
    case "list":
      return block.items.some((item) => filled(item.text));
    case "records": {
      const titleKey = block.fields.find((f) => f.kind === "title")?.key;
      return block.items.some((item) =>
        titleKey ? filled(item.values[titleKey]) : Object.values(item.values).some(filled)
      );
    }
    case "timeline":
      return block.items.length > 0;
    case "chart":
      return block.rows.length > 0;
  }
}

export type QuestionStatus = {
  question: Question;
  block: Block | undefined;
  answered: boolean;
};

export function questionStatuses(board: Board, stageId: StageId, section?: string): QuestionStatus[] {
  return questionsFor(stageId)
    .filter((q) => !section || q.section === section)
    .map((question) => {
      const block = findBlock(board, question.blockId);
      return { question, block, answered: isAnswered(block) };
    });
}

export type AnswerProgress = {
  answered: number;
  total: number;
  /** Answered, but still a best guess. Flagged, never blocking. */
  assumptions: number;
  complete: boolean;
};

export function answerProgress(board: Board, stageId: StageId, section?: string): AnswerProgress {
  const statuses = questionStatuses(board, stageId, section);
  const answered = statuses.filter((s) => s.answered);
  return {
    answered: answered.length,
    total: statuses.length,
    assumptions: answered.filter((s) => s.block?.confidence === "assumption").length,
    complete: statuses.length > 0 && answered.length === statuses.length,
  };
}

/**
 * The next unanswered question in a stage. With `after`, it looks forward
 * from that question and wraps round, skipping the question itself.
 */
export function nextOpenQuestion(board: Board, stageId: StageId, after?: string): Question | undefined {
  const statuses = questionStatuses(board, stageId);
  const start = after ? statuses.findIndex((s) => s.question.id === after) : -1;
  for (let step = 1; step <= statuses.length; step++) {
    const status = statuses[(start + step + statuses.length) % statuses.length];
    if (status.question.id !== after && !status.answered) return status.question;
  }
  return undefined;
}
