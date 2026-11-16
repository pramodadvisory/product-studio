import {
  addDaysISO,
  BACKLOG_SPRINT_ID,
  cellKey,
  formatSprintWindow,
  type Sprint,
  type StoryMap,
} from "./storymap";

// Each seed sprint runs 2 weeks back-to-back from a fixed anchor Monday.
function seedSprint(
  id: string,
  sprintNumber: number,
  name: string,
  outcome: string,
  startDate: string
): Sprint {
  const endDate = addDaysISO(startDate, 13);
  return {
    id,
    sprintNumber,
    name,
    outcome,
    startDate,
    endDate,
    window: formatSprintWindow(startDate, endDate),
  };
}

// Latest sprint first — new sprints are prepended, so the seed mirrors that order.
export const initialSprints: Sprint[] = [
  seedSprint(
    "sprint-4",
    4,
    "Dashboards & Alerts",
    "Client can build a live dashboard and get notified when a metric crosses a threshold",
    "2026-06-29"
  ),
  seedSprint(
    "sprint-3",
    3,
    "Data Integration",
    "Client can connect a data source and map its fields without engineering help",
    "2026-06-15"
  ),
  seedSprint(
    "sprint-2",
    2,
    "Team Onboarding",
    "Client can create a workspace and invite their whole team in under 5 minutes",
    "2026-06-01"
  ),
  seedSprint(
    "sprint-1",
    1,
    "Account Setup",
    "Client can sign up, verify their email, and log back in securely",
    "2026-05-18"
  ),
];

export const initialStoryMap: StoryMap = {
  goals: [
    { id: "goal-1", title: "User Authentication" },
    { id: "goal-2", title: "Account Setup" },
    { id: "goal-3", title: "Data Integration" },
    { id: "goal-4", title: "First Success" },
  ],
  features: [
    { id: "feature-1", title: "Sign up & login", goalId: "goal-1" },
    { id: "feature-2", title: "Email verification", goalId: "goal-1" },
    { id: "feature-3", title: "Create workspace", goalId: "goal-2" },
    { id: "feature-4", title: "Invite team members", goalId: "goal-2" },
    { id: "feature-5", title: "Connect data source", goalId: "goal-3" },
    { id: "feature-6", title: "Map data fields", goalId: "goal-3" },
    { id: "feature-7", title: "Create dashboard", goalId: "goal-4" },
    { id: "feature-8", title: "Set up alerts", goalId: "goal-4" },
  ],
  storiesByCell: {
    [cellKey("sprint-1", "feature-1")]: [
      {
        id: "story-1",
        text: "Implement email/password sign up form with validation",
        status: "done",
        priority: "high",
        storyPoints: 5,
        storyKey: "AUTH-1",
        assignee: "Alice",
      },
      {
        id: "story-2",
        text: "Add Google OAuth integration for sign up",
        status: "done",
        priority: "high",
        storyPoints: 8,
        storyKey: "AUTH-2",
        assignee: "Charlie",
      },
    ],
    [cellKey("sprint-1", "feature-2")]: [
      {
        id: "story-3",
        text: "Create email verification flow with token expiration",
        status: "in-progress",
        priority: "high",
        storyPoints: 5,
        storyKey: "AUTH-3",
        assignee: "Bob",
      },
    ],
    [cellKey("sprint-2", "feature-3")]: [
      {
        id: "story-4",
        text: "Create workspace with unique slug and branding",
        status: "in-progress",
        priority: "high",
        storyPoints: 8,
        storyKey: "SETUP-1",
        assignee: "Alice",
      },
    ],
    [cellKey("sprint-2", "feature-4")]: [
      {
        id: "story-5",
        text: "Invite team members with role-based permissions",
        status: "todo",
        priority: "high",
        storyPoints: 5,
        storyKey: "SETUP-2",
        assignee: "Bob",
      },
      {
        id: "story-6",
        text: "Send invite emails with onboarding link",
        status: "todo",
        priority: "medium",
        storyPoints: 3,
        storyKey: "SETUP-3",
      },
    ],
    [cellKey("sprint-3", "feature-5")]: [
      {
        id: "story-7",
        text: "Build connector UI for popular data sources",
        status: "todo",
        priority: "high",
        storyPoints: 13,
        storyKey: "DATA-1",
      },
    ],
    [cellKey("sprint-3", "feature-6")]: [
      {
        id: "story-8",
        text: "Create field mapping interface for data transformation",
        status: "todo",
        priority: "medium",
        storyPoints: 8,
        storyKey: "DATA-2",
      },
    ],
    [cellKey("sprint-4", "feature-7")]: [
      {
        id: "story-9",
        text: "Build dashboard builder with drag and drop",
        status: "todo",
        priority: "high",
        storyPoints: 13,
        storyKey: "DASH-1",
      },
    ],
    [cellKey("sprint-4", "feature-8")]: [
      {
        id: "story-10",
        text: "Implement alert rules and notifications",
        status: "todo",
        priority: "medium",
        storyPoints: 8,
        storyKey: "DASH-2",
      },
    ],
    [cellKey(BACKLOG_SPRINT_ID, "feature-1")]: [
      {
        id: "story-11",
        text: "Add two-factor authentication for security",
        status: "todo",
        priority: "medium",
        storyPoints: 5,
        storyKey: "AUTH-4",
      },
    ],
    [cellKey(BACKLOG_SPRINT_ID, "feature-5")]: [
      {
        id: "story-12",
        text: "Support additional data sources (Salesforce, HubSpot)",
        status: "todo",
        priority: "low",
        storyPoints: 13,
        storyKey: "DATA-3",
      },
    ],
    [cellKey(BACKLOG_SPRINT_ID, "feature-7")]: [
      {
        id: "story-13",
        text: "Add dashboard templates for quick setup",
        status: "todo",
        priority: "low",
        storyPoints: 8,
        storyKey: "DASH-3",
      },
    ],
  },
};
