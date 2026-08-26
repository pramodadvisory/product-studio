import { BOARD_SCHEMA_VERSION, type Board } from "./schema";

/**
 * Seed board.
 *
 * Two levels of structure: a section (one tab) contains groups, and a group
 * contains blocks. The tab bar navigates sections; the in-tab table of contents
 * navigates groups. Block sizes are chosen so each group's rows close on the
 * 6-column grid.
 *
 * IDs are static (never `newId()`) so server and client render identically.
 */
export const SEED_BOARD: Board = {
  id: "board-1",
  schemaVersion: BOARD_SCHEMA_VERSION,
  productName: "Customer Analytics Platform",
  status: "Growth",
  updatedAt: "2024-06-17T09:00:00.000Z",

  headline: [
    { id: "h-tam", label: "TAM", value: "$8.5B" },
    { id: "h-arr", label: "ARR target (Y1)", value: "$500K" },
    { id: "h-customers", label: "Customers (Y1)", value: "45" },
    { id: "h-payback", label: "CAC payback", value: "6.4 mo" },
    { id: "h-ga", label: "GA launch", value: "Q1 2025" },
  ],

  sections: [
    // ─────────────────────────────────────────────────────────── The Problem
    {
      id: "problem",
      title: "The Problem",
      groups: [
        {
          id: "g-who",
          title: "Customer Information",
          description: "The specific customer segments, personas, and buyer profiles this product is designed for. Everything in the Problem section builds from this understanding of who we're solving for.",
          blocks: [
            {
              id: "b-icp",
              type: "statement",
              title: "Ideal Customer Profile",
              description: "The one-sentence filter for who this product is — and isn't — for.",
              size: "full",
              emphasis: "hero",
              accent: "indigo",
              confidence: "validated",
              inSummary: true,
              body: "Mid-market B2B SaaS companies with 50-500 employees, $5M-$50M annual revenue, experiencing rapid growth and building dedicated product teams.",
            },
            {
              id: "b-firmographics",
              type: "metrics",
              title: "Firmographics",
              description: "Company attributes that define a qualified prospect — size, revenue, growth rate, geography, and industry focus.",
              size: "full",
              emphasis: "card",
              confidence: "validated",
              items: [
                { id: "f1", label: "Company Size", value: "50-500 employees" },
                { id: "f2", label: "Annual Revenue", value: "$5M-$50M" },
                { id: "f3", label: "Growth Rate", value: "50%+ YoY" },
                { id: "f4", label: "Geography", value: "US, EU, APAC" },
                { id: "f5", label: "Industry", value: "SaaS, E-commerce, B2B Marketplaces" },
                { id: "f6", label: "Funding Stage", value: "Series A-C" },
              ],
            },
            {
              id: "b-personas",
              type: "records",
              title: "Target Personas (Users)",
              description: "Two ACTUAL users and what they're trying to fix.",
              size: "full",
              emphasis: "card",
              confidence: "validated",
              columns: 2,
              fields: [
                { key: "name", label: "Persona", kind: "title" },
                { key: "budget", label: "Budget", kind: "badge" },
                { key: "company", label: "Company", kind: "text" },
                { key: "pains", label: "Pain points", kind: "text" },
                { key: "goals", label: "Goals", kind: "text" },
              ],
              items: [
                {
                  id: "per1",
                  values: {
                    name: "Sarah, Product Manager at Series B SaaS",
                    budget: "$5K-15K/month",
                    company: "50-200 employees",
                    pains:
                      "Can't track user behavior across channels, spends too much on tools",
                    goals: "Reduce churn, increase feature adoption",
                  },
                },
                {
                  id: "per2",
                  values: {
                    name: "James, Data Analyst at E-commerce",
                    budget: "$15K-30K/month",
                    company: "200-500 employees",
                    pains: "Complex setup, needs SQL knowledge, expensive integrations",
                    goals: "Real-time dashboards, easy cohort building",
                  },
                },
              ],
            },
            {
              id: "b-decision-makers",
              type: "records",
              title: "Key Decision Makers (Buyers)",
              description: "Who influences the purchase, and what each of them actually cares about.",
              size: "full",
              emphasis: "card",
              confidence: "assumption",
              columns: 4,
              fields: [
                { key: "role", label: "Role", kind: "title" },
                { key: "influence", label: "Influence", kind: "badge" },
                { key: "concern", label: "Primary concern", kind: "text" },
              ],
              items: [
                {
                  id: "dm1",
                  values: {
                    role: "VP Product",
                    influence: "High",
                    concern: "Feature depth, scalability",
                  },
                },
                {
                  id: "dm2",
                  values: {
                    role: "Head of Data",
                    influence: "High",
                    concern: "Data quality, integration, governance",
                  },
                },
                {
                  id: "dm3",
                  values: {
                    role: "Finance",
                    influence: "Medium",
                    concern: "Cost, ROI, contract terms",
                  },
                },
                {
                  id: "dm4",
                  values: {
                    role: "Product Manager",
                    influence: "High",
                    concern: "Ease of use, time to value",
                  },
                },
              ],
            },
          ],
        },
        {
          id: "g-hurts",
          title: "Customer's Pain Points",
          description: "The concrete problems, frustrations, and inefficiencies our target customer faces today. These are the pain points that create urgency and drive them to seek a solution.",
          blocks: [
            {
              id: "b-pains",
              type: "records",
              title: "Primary Pain Points",
              description: "The sharpest, most frequently cited problems this product needs to solve.",
              size: "two-thirds",
              emphasis: "card",
              confidence: "validated",
              inSummary: true,
              columns: 2,
              fields: [
                { key: "pain", label: "Pain", kind: "title" },
                { key: "impact", label: "Impact", kind: "badge" },
                { key: "segment", label: "Key for", kind: "text" },
              ],
              items: [
                {
                  id: "p1",
                  values: {
                    pain: "Can't track user behavior across touchpoints",
                    impact: "High",
                    segment: "Product Managers",
                  },
                },
                {
                  id: "p2",
                  values: {
                    pain: "Expensive analytics tools ($50K+/year)",
                    impact: "High",
                    segment: "Finance/Operations",
                  },
                },
                {
                  id: "p3",
                  values: {
                    pain: "Complex setup requiring data engineering",
                    impact: "Medium",
                    segment: "Technical Leads",
                  },
                },
                {
                  id: "p4",
                  values: {
                    pain: "Lack of AI-powered insights",
                    impact: "Medium",
                    segment: "Data Analysts",
                  },
                },
                {
                  id: "p5",
                  values: {
                    pain: "Poor user experience for non-technical users",
                    impact: "High",
                    segment: "Managers",
                  },
                },
              ],
            },
            {
              id: "b-behaviors",
              type: "list",
              title: "Customer Behaviours",
              description: "Current workarounds and behaviors customers use to solve this problem today — the status quo we're displacing.",
              size: "third",
              emphasis: "plain",
              confidence: "validated",
              items: [
                { id: "cb1", text: "Uses 3-5 different analytics tools" },
                { id: "cb2", text: "Spends 20+ hours/week on manual reporting" },
                { id: "cb3", text: "Evaluates new tools quarterly" },
                { id: "cb4", text: "Values ease of implementation" },
                { id: "cb5", text: "Active in product communities" },
              ],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────────── The Solution
    {
      id: "solution",
      title: "The Solution",
      groups: [
        {
          id: "g-promise",
          title: "What we promise",
          description: "The core value proposition, vision, and mission that define why this product exists and what it commits to deliver. This is the north star all features and decisions should align with.",
          blocks: [
            {
              id: "b-valueprop",
              type: "statement",
              title: "Value Proposition",
              description: "The single claim we're asking a buyer to believe.",
              size: "full",
              emphasis: "hero",
              accent: "emerald",
              confidence: "decided",
              inSummary: true,
              body: "Understand your users in minutes, not months. Get enterprise-grade analytics with 40% lower cost and zero data science needed.",
            },
            {
              id: "b-vision",
              type: "statement",
              title: "Vision",
              description: "The long-term change we want to exist in the world because of this product.",
              size: "half",
              emphasis: "hero",
              accent: "violet",
              confidence: "decided",
              inSummary: true,
              body: "Democratize customer analytics by providing enterprise-grade insights to mid-market companies without the complexity or cost of legacy solutions.",
            },
            {
              id: "b-mission",
              type: "statement",
              title: "Mission",
              description: "What the team does, day to day, in service of the vision.",
              size: "half",
              emphasis: "hero",
              accent: "emerald",
              confidence: "decided",
              inSummary: true,
              body: "Empower product teams to understand their customers deeply and make confident decisions that drive growth.",
            },
          ],
        },
        {
          id: "g-build",
          title: "What we build",
          description: "The features, capabilities, and technical implementation that bring the promise to life. This translates the value proposition into shipped product and the jobs users hire it to do.",
          blocks: [
            {
              id: "b-features",
              type: "records",
              title: "Core Features",
              description: "What ships, ranked by priority, and the value each one delivers to a user.",
              size: "two-thirds",
              emphasis: "card",
              confidence: "decided",
              inSummary: true,
              columns: 2,
              fields: [
                { key: "name", label: "Feature", kind: "title" },
                { key: "priority", label: "Priority", kind: "badge" },
                { key: "userValue", label: "User value", kind: "text" },
              ],
              items: [
                {
                  id: "cf1",
                  values: {
                    name: "Real-time event tracking",
                    priority: "P0",
                    userValue: "See user behavior as it happens",
                  },
                },
                {
                  id: "cf2",
                  values: {
                    name: "Behavioral cohort analysis",
                    priority: "P0",
                    userValue: "Group users by behavior, not just demographics",
                  },
                },
                {
                  id: "cf3",
                  values: {
                    name: "Predictive churn modeling",
                    priority: "P1",
                    userValue: "Identify at-risk users before they leave",
                  },
                },
                {
                  id: "cf4",
                  values: {
                    name: "Customizable dashboards",
                    priority: "P0",
                    userValue: "Build dashboards without code",
                  },
                },
                {
                  id: "cf5",
                  values: {
                    name: "AI-powered insights",
                    priority: "P1",
                    userValue: "AI discovers patterns automatically",
                  },
                },
                {
                  id: "cf6",
                  values: {
                    name: "Integration with 50+ tools",
                    priority: "P1",
                    userValue: "Works with your existing stack",
                  },
                },
              ],
            },
            {
              id: "b-jtbd",
              type: "list",
              title: "Jobs to be Done",
              description: "The core jobs users are hiring this product to do — the functional and emotional outcomes they're truly trying to achieve.",
              size: "third",
              emphasis: "plain",
              confidence: "validated",
              items: [
                { id: "j1", text: "Understand which features drive retention" },
                { id: "j2", text: "Identify user segments that convert better" },
                { id: "j3", text: "Predict churn and intervene early" },
                { id: "j4", text: "Optimize onboarding funnel" },
                { id: "j5", text: "Measure impact of product changes" },
              ],
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────── The Market
    {
      id: "market",
      title: "The Market",
      groups: [
        {
          id: "g-size",
          title: "Size & opportunity",
          description: "The total addressable market, market trends driving demand, and existing gaps in the competitive landscape. This frames the scale of the opportunity and validates why now is the right time to build.",
          blocks: [
            {
              id: "b-market-size",
              type: "metrics",
              title: "Market Size",
              description: "TAM (total addressable market), SAM (serviceable addressable market), and SOM (serviceable obtainable market) — showing the full market opportunity and our realistic slice of it.",
              size: "third",
              emphasis: "card",
              confidence: "assumption",
              inSummary: true,
              items: [
                { id: "ms1", label: "TAM", value: "$8.5B" },
                { id: "ms2", label: "SAM", value: "$2.1B (15% of TAM)" },
                { id: "ms3", label: "SOM", value: "$50M (2.4% of SAM)" },
              ],
            },
            {
              id: "b-trends",
              type: "list",
              title: "Market Trends",
              description: "Tailwinds and market shifts (regulatory, technological, behavioral) that create demand and make now the right time to launch.",
              size: "third",
              emphasis: "plain",
              confidence: "validated",
              items: [
                { id: "mt1", text: "Shift from basic analytics to AI-powered insights" },
                { id: "mt2", text: "Growing demand for real-time data (not batch)" },
                { id: "mt3", text: "Consolidation pressure - teams want fewer tools" },
                { id: "mt4", text: "Privacy-first analytics becoming standard" },
              ],
            },
            {
              id: "b-gaps",
              type: "list",
              title: "Market Gaps",
              description: "Unmet needs and underserved segments that no competitor adequately addresses — the whitespace where we can win.",
              size: "third",
              emphasis: "plain",
              confidence: "assumption",
              items: [
                { id: "g1", text: "No solution for <50 person companies (price point gap)" },
                { id: "g2", text: "Privacy-first analytics missing in mid-market" },
                {
                  id: "g3",
                  text: "No platform that combines analytics with experimentation",
                },
              ],
            },
          ],
        },
        {
          id: "g-win",
          title: "Competition",
          description: "Direct and indirect competitors, their strengths and weaknesses, and the specific edges that make our product the better choice. This defines our competitive positioning and differentiation strategy.",
          blocks: [
            {
              id: "b-competitors",
              type: "records",
              title: "Competitive Landscape",
              description: "Head-to-head competitive analysis showing each competitor's strengths, weaknesses, and the specific advantages we hold against them.",
              size: "two-thirds",
              emphasis: "card",
              confidence: "validated",
              inSummary: true,
              columns: 2,
              fields: [
                { key: "name", label: "Competitor", kind: "title" },
                { key: "strength", label: "Strength", kind: "text" },
                { key: "weakness", label: "Weakness", kind: "text" },
                { key: "edge", label: "Our edge", kind: "text" },
              ],
              items: [
                {
                  id: "co1",
                  values: {
                    name: "Mixpanel",
                    strength: "Large user base, mature platform",
                    weakness: "High pricing, steep learning curve",
                    edge: "Lower price, simpler UX, faster setup",
                  },
                },
                {
                  id: "co2",
                  values: {
                    name: "Amplitude",
                    strength: "Advanced analytics, strong brand",
                    weakness: "Expensive, complex for small teams",
                    edge: "More intuitive, better for small teams",
                  },
                },
                {
                  id: "co3",
                  values: {
                    name: "Heap",
                    strength: "Auto-capture technology",
                    weakness: "Limited AI features, expensive",
                    edge: "Advanced AI features, custom cohorts",
                  },
                },
                {
                  id: "co4",
                  values: {
                    name: "Intercom",
                    strength: "Great for messaging",
                    weakness: "Limited analytics capabilities",
                    edge: "Purpose-built for product analytics",
                  },
                },
              ],
            },
            {
              id: "b-radar",
              type: "chart",
              title: "Competitor Analysis",
              description: "Visual competitive radar showing how we score against rivals across pricing, features, ease of use, and other key decision criteria.",
              size: "third",
              emphasis: "card",
              variant: "radar",
              confidence: "assumption",
              caption: "Competitive advantage across 6 key dimensions",
              series: [
                { key: "us", label: "Us", color: "#10b981" },
                { key: "mixpanel", label: "Mixpanel", color: "#3b82f6" },
                { key: "amplitude", label: "Amplitude", color: "#f59e0b" },
              ],
              rows: [
                { id: "r1", label: "Pricing", values: { us: 85, mixpanel: 60, amplitude: 65 } },
                {
                  id: "r2",
                  label: "AI Features",
                  values: { us: 95, mixpanel: 50, amplitude: 55 },
                },
                {
                  id: "r3",
                  label: "Ease of Use",
                  values: { us: 80, mixpanel: 70, amplitude: 75 },
                },
                {
                  id: "r4",
                  label: "Integration",
                  values: { us: 90, mixpanel: 85, amplitude: 80 },
                },
                { id: "r5", label: "Support", values: { us: 85, mixpanel: 75, amplitude: 80 } },
                {
                  id: "r6",
                  label: "Scalability",
                  values: { us: 90, mixpanel: 88, amplitude: 85 },
                },
              ],
            },
            {
              id: "b-positioning",
              type: "statement",
              title: "Positioning",
              description: "The one-line positioning statement that defines how we fit in the market relative to competitors — the frame we use in all marketing.",
              size: "full",
              emphasis: "plain",
              accent: "violet",
              confidence: "decided",
              body: "Amplitude + Mixpanel combined, 40% cheaper.",
            },
          ],
        },
        {
          id: "g-reach",
          title: "How we reach them",
          description: "The go-to-market strategy, distribution channels, and target customer segments where we'll focus initial efforts. This bridges the gap between building a great product and finding customers who need it.",
          blocks: [
            {
              id: "b-gtm",
              type: "list",
              title: "Go-to-Market Channels",
              description: "The distribution and discovery channels (self-serve, partnerships, sales, community) through which customers will first encounter and try this product.",
              size: "half",
              emphasis: "plain",
              confidence: "assumption",
              items: [
                { id: "gtm1", text: "Self-serve SaaS" },
                { id: "gtm2", text: "Freemium model" },
                { id: "gtm3", text: "Partner integrations" },
                { id: "gtm4", text: "Community & content marketing" },
              ],
            },
            {
              id: "b-segments",
              type: "list",
              title: "Target Segments",
              description: "The priority customer segments and verticals where we'll focus go-to-market efforts — the beachhead market where we'll establish dominance first.",
              size: "half",
              emphasis: "plain",
              confidence: "validated",
              items: [
                { id: "ts1", text: "SaaS companies 50-500 employees" },
                { id: "ts2", text: "E-commerce platforms" },
                { id: "ts3", text: "B2B marketplaces" },
              ],
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────── The Outcome
    {
      id: "outcome",
      title: "The Outcome",
      groups: [
        {
          id: "g-success",
          title: "Definition of success",
          description: "The measurable success criteria and KPI targets that define what winning looks like. These are the metrics the team is accountable for and that signal whether the product is working.",
          blocks: [
            {
              id: "b-success",
              type: "list",
              title: "Success Criteria",
              description: "The qualitative and quantitative targets that define product success — user onboarding speed, engagement metrics, satisfaction scores, and retention thresholds.",
              size: "half",
              emphasis: "plain",
              confidence: "decided",
              inSummary: true,
              items: [
                { id: "sc1", text: "Users complete first dashboard in <15 min" },
                {
                  id: "sc2",
                  text: "80% of users find at least one actionable insight per week",
                },
                { id: "sc3", text: "Net promoter score >50" },
                { id: "sc4", text: "Customer retention >85%" },
              ],
            },
            {
              id: "b-kpis",
              type: "metrics",
              title: "KPI Targets",
              description: "The key performance indicators (MAU, retention, NRR, CAC payback) that track whether the product is working and the business is healthy.",
              size: "half",
              emphasis: "card",
              confidence: "decided",
              inSummary: true,
              items: [
                { id: "k1", label: "Monthly active users", value: "500+" },
                { id: "k2", label: "Customer retention", value: "85%+" },
                { id: "k3", label: "Net revenue retention", value: "110%+" },
                { id: "k4", label: "CAC payback", value: "<12 months" },
              ],
            },
          ],
        },
        {
          id: "g-economics",
          title: "Economics",
          description: "The unit economics, pricing strategy, and financial model that prove the business is viable and sustainable. This validates that the product can be profitable and scaled.",
          blocks: [
            {
              id: "b-unit-economics",
              type: "metrics",
              title: "Unit Economics",
              description: "The per-customer economics — acquisition cost (CAC), lifetime value (ACV), payback period, and expansion revenue (NRR) that drive profitability.",
              size: "full",
              emphasis: "card",
              confidence: "assumption",
              inSummary: true,
              items: [
                { id: "u1", label: "ACV", value: "$15,000" },
                { id: "u2", label: "CAC", value: "$8,000" },
                { id: "u3", label: "CAC payback", value: "6.4 months" },
                { id: "u4", label: "Net revenue retention", value: "110%" },
              ],
            },
            {
              id: "b-pricing",
              type: "records",
              title: "Pricing Tiers",
              description: "The pricing model and tiers that balance accessibility for early adopters with margin for growth — what each tier includes and costs.",
              size: "full",
              emphasis: "card",
              confidence: "decided",
              columns: 3,
              fields: [
                { key: "tier", label: "Tier", kind: "title" },
                { key: "price", label: "Price", kind: "badge" },
                { key: "seats", label: "Seats", kind: "text" },
                { key: "events", label: "Monthly events", kind: "text" },
              ],
              items: [
                {
                  id: "pt1",
                  values: { tier: "Starter", price: "$499/month", seats: "3", events: "50M" },
                },
                {
                  id: "pt2",
                  values: {
                    tier: "Professional",
                    price: "$1,999/month",
                    seats: "10",
                    events: "500M",
                  },
                },
                {
                  id: "pt3",
                  values: {
                    tier: "Enterprise",
                    price: "Custom",
                    seats: "Unlimited",
                    events: "Unlimited",
                  },
                },
              ],
            },
          ],
        },
        {
          id: "g-projections",
          title: "Projections",
          description: "Revenue, customer, and growth projections over the planning horizon. These forward-looking numbers shape hiring, investment, and strategic decisions across the organization.",
          blocks: [
            {
              id: "b-arr",
              type: "chart",
              title: "ARR Projection",
              description: "Year-over-year revenue projections showing the growth path from launch through profitability — the financial trajectory that funds the team.",
              size: "half",
              emphasis: "card",
              variant: "area",
              unit: "currency-m",
              confidence: "assumption",
              caption: "15x ARR growth from Year 1 to Year 3",
              series: [{ key: "arr", label: "ARR ($M)", color: "#10b981" }],
              rows: [
                { id: "a1", label: "Year 1", values: { arr: 0.5 } },
                { id: "a2", label: "Year 2", values: { arr: 2.5 } },
                { id: "a3", label: "Year 3", values: { arr: 7.5 } },
              ],
            },
            {
              id: "b-customers",
              type: "chart",
              title: "Customer Growth",
              description: "The growing customer base over time — showing path to scale from initial launch through a meaningful market presence.",
              size: "half",
              emphasis: "card",
              variant: "bar",
              confidence: "assumption",
              caption: "Scaling to 500 customers by Year 3",
              series: [{ key: "customers", label: "Customers", color: "#0ea5e9" }],
              rows: [
                { id: "c1", label: "Year 1", values: { customers: 45 } },
                { id: "c2", label: "Year 2", values: { customers: 180 } },
                { id: "c3", label: "Year 3", values: { customers: 500 } },
              ],
            },
            {
              id: "b-projections",
              type: "records",
              title: "Financial Projections",
              description: "Comprehensive financial forecast showing ARR, monthly active users, customer count, and key milestones (burn, breakeven) across the planning horizon.",
              size: "full",
              emphasis: "card",
              confidence: "assumption",
              columns: 3,
              fields: [
                { key: "year", label: "Year", kind: "title" },
                { key: "arr", label: "ARR", kind: "badge" },
                { key: "mau", label: "MAU", kind: "text" },
                { key: "customers", label: "Customers", kind: "text" },
                { key: "note", label: "Note", kind: "text" },
              ],
              items: [
                {
                  id: "fp1",
                  values: {
                    year: "Year 1",
                    arr: "$500K",
                    mau: "500",
                    customers: "45",
                    note: "Burn $150K",
                  },
                },
                {
                  id: "fp2",
                  values: {
                    year: "Year 2",
                    arr: "$2.5M",
                    mau: "2,000",
                    customers: "180",
                    note: "Breakeven Q3 2025",
                  },
                },
                {
                  id: "fp3",
                  values: {
                    year: "Year 3",
                    arr: "$7.5M",
                    mau: "5,000",
                    customers: "500",
                    note: "40% margin",
                  },
                },
              ],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────────── The Progress
    {
      id: "progress",
      title: "The Progress",
      groups: [
        {
          id: "g-plan",
          title: "Delivery plan",
          description: "The phased release plan, team structure, and critical dependencies that ensure on-time delivery. This is the roadmap that guides engineering and product execution.",
          blocks: [
            {
              id: "b-phases",
              type: "timeline",
              title: "Development Phases",
              description: "The phased rollout of features from MVP through GA — showing what ships in each phase, the timeline, and the team size needed to execute.",
              size: "two-thirds",
              emphasis: "card",
              confidence: "decided",
              inSummary: true,
              items: [
                {
                  id: "ph1",
                  label: "Phase 1: MVP",
                  meta: "Q3 2024 (8 weeks)",
                  bullets: [
                    "Core event tracking",
                    "Basic dashboards",
                    "Cohort builder",
                    "5 integrations",
                  ],
                  note: "4 engineers, 1 PM, 1 designer",
                },
                {
                  id: "ph2",
                  label: "Phase 2: Beta",
                  meta: "Q4 2024 (12 weeks)",
                  bullets: [
                    "AI insights",
                    "Advanced cohorts",
                    "Predictive models",
                    "50+ integrations",
                  ],
                  note: "6 engineers, 1 PM, 1 designer, 1 data scientist",
                },
                {
                  id: "ph3",
                  label: "Phase 3: GA & Scale",
                  meta: "Q1-Q2 2025 (16 weeks)",
                  bullets: [
                    "Full feature parity",
                    "Enterprise features",
                    "Sales team",
                    "Marketing campaign",
                  ],
                  note: "8 engineers, 2 PMs, 2 designers, 1 data scientist, sales & marketing",
                },
              ],
            },
            {
              id: "b-dependencies",
              type: "list",
              title: "Dependencies",
              description: "Critical external dependencies and blockers — platform work, partnerships, or regulatory approvals that must land for the roadmap to succeed.",
              size: "third",
              emphasis: "plain",
              confidence: "decided",
              items: [
                { id: "d1", text: "Data pipeline infrastructure" },
                { id: "d2", text: "ML model training for churn prediction" },
                { id: "d3", text: "Integration partner agreements" },
              ],
            },
          ],
        },
        {
          id: "g-readiness",
          title: "Launch readiness",
          description: "The pre-launch checklist of marketing, support, and operational readiness that must be complete before customers see the product. This ensures a smooth, confident launch.",
          blocks: [
            {
              id: "b-checklist",
              type: "list",
              title: "Launch Checklist",
              description: "The pre-launch checklist covering product, marketing, sales, support, and partnerships — go/no-go gates that must be cleared before launch day.",
              size: "full",
              emphasis: "card",
              checkable: true,
              confidence: "decided",
              inSummary: true,
              items: [
                { id: "lc1", text: "Website & docs complete", done: true },
                { id: "lc2", text: "Sales collateral prepared", done: true },
                { id: "lc3", text: "Support team trained", done: false },
                { id: "lc4", text: "Community launched", done: false },
                { id: "lc5", text: "Press/analyst outreach", done: false },
                { id: "lc6", text: "Partner integrations ready", done: false },
              ],
            },
          ],
        },
        {
          id: "g-risk",
          title: "Risks & upside",
          description: "The key risks that could derail success with mitigation strategies, plus opportunities for unplanned upside and growth strategies that could expand the product's impact beyond the current plan.",
          blocks: [
            {
              id: "b-risks",
              type: "records",
              title: "Risks & Mitigations",
              description: "The top threats to success (competition, hiring, regulation) with assessed impact and probability, plus concrete mitigation strategies for each.",
              size: "two-thirds",
              emphasis: "card",
              confidence: "assumption",
              inSummary: true,
              columns: 2,
              fields: [
                { key: "risk", label: "Risk", kind: "title" },
                { key: "impact", label: "Impact", kind: "badge" },
                { key: "probability", label: "Probability", kind: "badge" },
                { key: "mitigation", label: "Mitigation", kind: "text" },
              ],
              items: [
                {
                  id: "rk1",
                  values: {
                    risk: "Data privacy regulations",
                    impact: "High",
                    probability: "Medium",
                    mitigation: "GDPR/CCPA compliance from day 1",
                  },
                },
                {
                  id: "rk2",
                  values: {
                    risk: "Competitor launches cheaper tier",
                    impact: "High",
                    probability: "Medium",
                    mitigation:
                      "Move fast; build switching costs via community & integrations",
                  },
                },
                {
                  id: "rk3",
                  values: {
                    risk: "Customer acquisition shortfall",
                    impact: "High",
                    probability: "Medium",
                    mitigation: "Strong GTM, brand partnerships",
                  },
                },
                {
                  id: "rk4",
                  values: {
                    risk: "Data storage costs spike with scale",
                    impact: "Medium",
                    probability: "Medium",
                    mitigation: "Invest in data compression, tiered storage",
                  },
                },
                {
                  id: "rk5",
                  values: {
                    risk: "Hard to hire skilled data engineers",
                    impact: "Medium",
                    probability: "Medium",
                    mitigation: "Build ops team early, competitive comp",
                  },
                },
              ],
            },
            {
              id: "b-opportunities",
              type: "list",
              title: "Key Opportunities",
              description: "Unplanned upside opportunities — adjacent markets, emerging use cases, or platform expansion opportunities that could unlock additional growth.",
              size: "third",
              emphasis: "plain",
              confidence: "assumption",
              items: [
                {
                  id: "op1",
                  text: "AI-powered auto-discovery of segments (unaddressed need)",
                },
                { id: "op2", text: "Privacy-first analytics (regulatory tailwind)" },
                { id: "op3", text: "Vertical-specific templates (quick wins)" },
                { id: "op4", text: "Developer-first API (TAM expansion)" },
              ],
            },
            {
              id: "b-growth",
              type: "list",
              title: "Growth Strategies",
              description: "The post-product-market-fit expansion strategies — how we scale vertically into adjacent segments, expand platform scope, and build ecosystem partnerships.",
              size: "full",
              emphasis: "plain",
              confidence: "assumption",
              items: [
                {
                  id: "gs1",
                  text: "Vertical expansion: E-commerce templates, SaaS toolkit, Fintech specialization",
                },
                {
                  id: "gs2",
                  text: "Platform expansion: Add experimentation, A/B testing, feature flags",
                },
                { id: "gs3", text: "Ecosystem: Build partner marketplace, community apps" },
                {
                  id: "gs4",
                  text: "Land & expand: Start with 1 use case, expand to entire analytics suite",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
