import {
  FileTextIcon,
  GavelIcon,
  LayoutGridIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Project navigation, organised by the five delivery stages:
 * Discover → Define → Design → Develop → Deploy.
 *
 * Every project page belongs to exactly one stage, so the sidebar, the
 * breadcrumbs, the page eyebrows and the assistant's "where does this go"
 * all read from this one table. Pages built from Product Board content name
 * the board groups they show (`groupIds`); moving content between pages is a
 * change here, not in the stored board.
 *
 * Discover and Define are report stages: their pages are sections of one
 * stage report (/discover/report#customers), filled in by answering the
 * stage's questions one at a time (/discover/answer). The questions live in
 * `src/lib/questions.ts`.
 *
 * Stages are places, not gates: nothing locks. Each stage's "done when"
 * criteria live in `src/lib/stages.ts`.
 */
export type StageId = "discover" | "define" | "design" | "develop" | "deploy";

export type StagePage = {
  /** URL segment under the stage, e.g. /discover/customers */
  slug: string;
  title: string;
  /** The one question this page answers, shown under its title. */
  question: string;
  /**
   * The same page as a stakeholder would ask about it, for people reading a
   * published project who don't know the stages: "What could go wrong?"
   */
  readerQuestion: string;
  /** Product Board groups shown on this page, when it is built from the board. */
  groupIds?: string[];
};

export type Stage = {
  id: StageId;
  step: number;
  name: string;
  question: string;
  url: string;
  pages: StagePage[];
  /** Methods (Plays) that produce this stage's work. */
  plays: string[];
  /**
   * A report stage asks questions: its pages are sections of one report, and
   * it is complete once every question has an answer.
   */
  report?: boolean;
};

export const STAGES: Stage[] = [
  {
    id: "discover",
    step: 1,
    name: "Discover",
    question: "Who has the problem, and is it worth solving?",
    url: "/discover",
    pages: [
      {
        slug: "customers",
        title: "Customers & pain points",
        question: "Who they are, and what hurts most.",
        readerQuestion: "Who has the problem?",
        groupIds: ["g-who", "g-hurts"],
      },
      {
        slug: "market",
        title: "Market & competitors",
        question: "How big the opportunity is, and who else is solving it.",
        readerQuestion: "How big is the opportunity?",
        groupIds: ["g-size", "g-win", "g-reach"],
      },
    ],
    plays: ["Market research", "Competitor research", "Market sizing"],
    report: true,
  },
  {
    id: "define",
    step: 2,
    name: "Define",
    question: "What are we committing to, and how will we know it worked?",
    url: "/define",
    pages: [
      {
        slug: "solution",
        title: "Value proposition & solution",
        question: "What we promise, and the core features that deliver it.",
        readerQuestion: "What are we building?",
        groupIds: ["g-promise", "g-build"],
      },
      {
        slug: "experience",
        title: "Experience & design",
        question: "Who uses it, where, and what the experience must get right.",
        readerQuestion: "What must the experience get right?",
        groupIds: ["g-experience"],
      },
      {
        slug: "business-model",
        title: "Business model",
        question: "How the numbers work.",
        readerQuestion: "How will it make money?",
        groupIds: ["g-economics", "g-projections"],
      },
      {
        slug: "targets",
        title: "Success targets",
        question: "The numbers that tell us it worked.",
        readerQuestion: "How will we know it worked?",
        groupIds: ["g-success"],
      },
      {
        slug: "risks",
        title: "Risks",
        question: "What could stop us, and what we'll do about it.",
        readerQuestion: "What could go wrong?",
        groupIds: ["g-risk"],
      },
    ],
    plays: ["Problem statement", "Business case", "PRD", "Goals & OKRs", "Feasibility analysis"],
    report: true,
  },
  {
    id: "design",
    step: 3,
    name: "Design",
    question: "Will our solution work for the people who need it?",
    url: "/design",
    pages: [
      {
        slug: "experiments",
        title: "Experiments",
        question: "What we're testing, and what we've learned.",
        readerQuestion: "What have we tested?",
      },
    ],
    plays: ["Ideation", "Journey mapping", "Wireframes", "Design brief"],
  },
  {
    id: "develop",
    step: 4,
    name: "Develop",
    question: "Are we building the right things, in the right order?",
    url: "/develop",
    pages: [
      {
        slug: "story-map",
        title: "Story map",
        question: "Every story, across every goal and sprint.",
        readerQuestion: "What is being built, sprint by sprint?",
      },
      {
        slug: "delivery-plan",
        title: "Delivery plan",
        question: "The phases that get us to launch, and what they depend on.",
        readerQuestion: "When will it ship?",
        groupIds: ["g-plan"],
      },
    ],
    plays: ["Epics, features & stories", "Sprint planning"],
  },
  {
    id: "deploy",
    step: 5,
    name: "Deploy",
    question: "Is it live, and is it working?",
    url: "/deploy",
    pages: [
      {
        slug: "launch",
        title: "Launch checklist",
        question: "What must be true before launch.",
        readerQuestion: "Is it ready to launch?",
        groupIds: ["g-readiness"],
      },
      {
        slug: "metrics",
        title: "Metrics",
        question: "Are we hitting the targets we set?",
        readerQuestion: "Is it hitting its targets?",
      },
    ],
    plays: ["Stakeholder update", "Metrics review", "Benefits realisation"],
  },
];

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const OVERVIEW_ITEM: NavItem = {
  title: "Overview",
  url: "/overview",
  icon: LayoutGridIcon,
};

/** Used in every stage, so they sit outside the five. */
export const LIBRARY_ITEMS: NavItem[] = [
  { title: "Decisions", url: "/decisions", icon: GavelIcon },
  { title: "Docs", url: "/docs", icon: FileTextIcon },
];

export function getStage(id: StageId): Stage {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

/** Where a page lives. A report stage's pages are sections of its report. */
export function pageUrl(stage: Stage, page: StagePage): string {
  return stage.report ? `${reportUrl(stage)}#${page.slug}` : `${stage.url}/${page.slug}`;
}

/** The stage report: every answer in the stage as one document. */
export function reportUrl(stage: Stage): string {
  return `${stage.url}/report`;
}

/** The question flow. With no question id it opens the first open question. */
export function answerUrl(stage: Stage, questionId?: string): string {
  return questionId ? `${stage.url}/answer?q=${encodeURIComponent(questionId)}` : `${stage.url}/answer`;
}

export function getStagePage(stageId: StageId, slug: string): { stage: Stage; page: StagePage } {
  const stage = getStage(stageId);
  const page = stage.pages.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown page: ${stageId}/${slug}`);
  return { stage, page };
}

/** Which stage (and page, if any) a URL belongs to. */
export function locate(pathname: string): { stage?: Stage; page?: StagePage } {
  for (const stage of STAGES) {
    if (pathname === stage.url) return { stage };
    if (pathname.startsWith(`${stage.url}/`)) {
      const slug = pathname.slice(stage.url.length + 1).split("/")[0];
      return { stage, page: stage.pages.find((p) => p.slug === slug) };
    }
  }
  return {};
}

/** The stage page that shows a given Product Board group. */
export function locateGroup(groupId: string): { stage: Stage; page: StagePage } | undefined {
  for (const stage of STAGES) {
    const page = stage.pages.find((p) => p.groupIds?.includes(groupId));
    if (page) return { stage, page };
  }
  return undefined;
}

export function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** "1 · Discover" */
export function stageEyebrow(stage: Stage) {
  return `${stage.step} · ${stage.name}`;
}

/** "Discover › Customers & pain points" — used in breadcrumbs and by the assistant. */
export function pagePath(stage: Stage, page?: StagePage) {
  return page ? `${stage.name} › ${page.title}` : stage.name;
}
