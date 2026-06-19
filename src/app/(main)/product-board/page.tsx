"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Download, Share2, Plus, TrendingUp, BarChart3, Users, Target, Zap, Calendar, AlertCircle, Rocket, Lightbulb, ShieldAlert, ListChecks, DollarSign, Compass, CheckCircle2, ArrowUpRight, Building2 } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { CreateProductModal, type CreateModalField } from "@/components/create-product-modal";
import { MeshGradient } from "@paper-design/shaders-react";
import SimpleUserProfile from "@/components/blocks/application/user-profiles/simple";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts";

const CREATE_FIELDS: CreateModalField[] = [
  {
    name: "productName",
    label: "Product Name",
    placeholder: "e.g., Customer Analytics Platform",
    type: "input",
    required: true,
  },
  {
    name: "industry",
    label: "Industry",
    placeholder: "Select an industry",
    type: "select",
    required: true,
    options: [
      "SaaS",
      "E-commerce",
      "FinTech",
      "Healthcare",
      "EdTech",
      "Social Media",
      "Enterprise Software",
      "Mobile App",
      "AI/ML",
      "Other",
    ],
  },
  {
    name: "targetMarket",
    label: "Who is it for?",
    placeholder: "e.g., Marketing teams, Product managers",
    type: "input",
  },
  {
    name: "vision",
    label: "Purpose & Vision",
    placeholder: "What problem does this solve? What's the vision?",
    type: "textarea",
  },
  {
    name: "keyFeatures",
    label: "Key Features",
    placeholder: "What are the main features or capabilities?",
    type: "textarea",
  },
];

const DUMMY_PRODUCT_BOARD = {
  id: "board-1",
  productName: "Customer Analytics Platform",
  createdAt: "2024-06-17",
  status: "Growth",

  // Overview Tab
  overview: {
    executiveSummary: "A next-generation customer analytics platform designed to help product teams understand user behavior in real-time, make data-driven decisions, and accelerate product growth. Our platform combines simplicity with advanced analytics capabilities.",
    keyMetrics: {
      marketSize: "$8.5B TAM",
      targetUsers: "500+ mid-market companies",
      revenueTarget: "$500K ARR (Year 1)",
      growthRate: "12% CAGR"
    },
    timeline: {
      mvpLaunch: "Q3 2024",
      betaPhase: "Q4 2024",
      gaLaunch: "Q1 2025",
      scale: "H2 2025"
    }
  },

  // Strategy Tab
  strategy: {
    vision: "Democratize customer analytics by providing enterprise-grade insights to mid-market companies without the complexity or cost of legacy solutions.",
    missionStatement: "Empower product teams to understand their customers deeply and make confident decisions that drive growth.",
    gtmStrategy: {
      channels: ["Self-serve SaaS", "Freemium model", "Partner integrations", "Community & content marketing"],
      targetSegments: ["SaaS companies 50-500 employees", "E-commerce platforms", "B2B marketplaces"],
      positioning: "Amplitude + Mixpanel combined, 40% cheaper"
    },
    kpis: {
      monthly_active_users: "500+",
      customer_retention: "85%+",
      nrr: "110%+",
      cac_payback: "<12 months",
      time_to_value: "<15 minutes"
    },
    competitivePositioning: {
      vs_mixpanel: "Lower price, simpler UX, faster setup",
      vs_amplitude: "More intuitive, better for small teams",
      vs_heap: "Advanced AI features, custom cohorts"
    }
  },

  // Market Analysis Tab
  marketAnalysis: {
    tam: {
      total: "$8.5B",
      sam: "$2.1B (15% of TAM)",
      som: "$50M (2.4% of SAM)"
    },
    targetCustomerPersonas: [
      {
        name: "Sarah, Product Manager at Series B SaaS",
        company: "50-200 employees",
        pain_points: "Can't track user behavior across channels, spends too much on tools",
        goals: "Reduce churn, increase feature adoption",
        budget: "$5K-15K/month"
      },
      {
        name: "James, Data Analyst at E-commerce",
        company: "200-500 employees",
        pain_points: "Complex setup, needs SQL knowledge, expensive integrations",
        goals: "Real-time dashboards, easy cohort building",
        budget: "$15K-30K/month"
      }
    ],
    marketTrends: [
      "Shift from basic analytics to AI-powered insights",
      "Growing demand for real-time data (not batch)",
      "Consolidation pressure - teams want fewer tools",
      "Privacy-first analytics becoming standard"
    ],
    competitiveLandscape: [
      { name: "Mixpanel", strength: "Large user base, mature platform", weakness: "High pricing, steep learning curve" },
      { name: "Amplitude", strength: "Advanced analytics, strong brand", weakness: "Expensive, complex for small teams" },
      { name: "Heap", strength: "Auto-capture technology", weakness: "Limited AI features, expensive" },
      { name: "Intercom", strength: "Great for messaging", weakness: "Limited analytics capabilities" }
    ]
  },

  // Product Definition Tab
  productDefinition: {
    valueProposition: "Understand your users in minutes, not months. Get enterprise-grade analytics with 40% lower cost and zero data science needed.",
    coreFeatures: [
      { name: "Real-time event tracking", priority: "P0", userValue: "See user behavior as it happens" },
      { name: "Behavioral cohort analysis", priority: "P0", userValue: "Group users by behavior, not just demographics" },
      { name: "Predictive churn modeling", priority: "P1", userValue: "Identify at-risk users before they leave" },
      { name: "Customizable dashboards", priority: "P0", userValue: "Build dashboards without code" },
      { name: "AI-powered insights", priority: "P1", userValue: "AI discovers patterns automatically" },
      { name: "Integration with 50+ tools", priority: "P1", userValue: "Works with your existing stack" }
    ],
    jobsToBeDone: [
      "Understand which features drive retention",
      "Identify user segments that convert better",
      "Predict churn and intervene early",
      "Optimize onboarding funnel",
      "Measure impact of product changes"
    ],
    successCriteria: [
      "Users complete first dashboard in <15 min",
      "80% of users find at least one actionable insight per week",
      "Net promoter score >50",
      "Customer retention >85%"
    ]
  },

  // Financial Tab
  financial: {
    revenueModel: "Seat-based SaaS with usage-based pricing tiers",
    pricingStrategy: {
      starter: { price: "$499/month", seats: 3, monthlyEvents: "50M" },
      professional: { price: "$1,999/month", seats: 10, monthlyEvents: "500M" },
      enterprise: { price: "Custom", seats: "Unlimited", monthlyEvents: "Unlimited" }
    },
    unitEconomics: {
      acv: "$15,000",
      cac: "$8,000",
      cac_payback_months: 6.4,
      nrr: "110%",
      payback_period: "8 months"
    },
    financialProjections: {
      year1: {
        mau: "500",
        arr: "$500K",
        customers: 45,
        burn: "$150K"
      },
      year2: {
        mau: "2000",
        arr: "$2.5M",
        customers: 180,
        breakeven: "Q3 2025"
      },
      year3: {
        mau: "5000",
        arr: "$7.5M",
        customers: 500,
        margin: "40%"
      }
    }
  },

  // Execution Tab
  execution: {
    phases: [
      {
        phase: "Phase 1: MVP",
        timeline: "Q3 2024 (8 weeks)",
        milestones: ["Core event tracking", "Basic dashboards", "Cohort builder", "5 integrations"],
        resources: "4 engineers, 1 PM, 1 designer"
      },
      {
        phase: "Phase 2: Beta",
        timeline: "Q4 2024 (12 weeks)",
        milestones: ["AI insights", "Advanced cohorts", "Predictive models", "50+ integrations"],
        resources: "6 engineers, 1 PM, 1 designer, 1 data scientist"
      },
      {
        phase: "Phase 3: GA & Scale",
        timeline: "Q1-Q2 2025 (16 weeks)",
        milestones: ["Full feature parity", "Enterprise features", "Sales team", "Marketing campaign"],
        resources: "8 engineers, 2 PMs, 2 designers, 1 data scientist, sales & marketing"
      }
    ],
    dependencies: [
      "Data pipeline infrastructure",
      "ML model training for churn prediction",
      "Integration partner agreements"
    ],
    risks: [
      { risk: "Data privacy regulations", impact: "High", mitigation: "GDPR/CCPA compliance from day 1" },
      { risk: "Competitive response", impact: "Medium", mitigation: "Move fast, build moat with AI" },
      { risk: "Customer acquisition", impact: "High", mitigation: "Strong GTM, brand partnerships" }
    ],
    launchChecklist: [
      "Website & docs complete",
      "Sales collateral prepared",
      "Support team trained",
      "Community launched",
      "Press/analyst outreach",
      "Partner integrations ready"
    ]
  },

  // ICP Tab
  icp: {
    icpDescription: "Mid-market B2B SaaS companies with 50-500 employees, $5M-$50M annual revenue, experiencing rapid growth and building dedicated product teams.",
    firmographics: [
      { label: "Company Size", value: "50-500 employees" },
      { label: "Annual Revenue", value: "$5M-$50M" },
      { label: "Growth Rate", value: "50%+ YoY" },
      { label: "Geography", value: "US, EU, APAC" },
      { label: "Industry", value: "SaaS, E-commerce, B2B Marketplaces" },
      { label: "Funding Stage", value: "Series A-C" }
    ],
    painPoints: [
      { pain: "Can't track user behavior across touchpoints", impact: "High", segment: "Product Managers" },
      { pain: "Expensive analytics tools ($50K+/year)", impact: "High", segment: "Finance/Operations" },
      { pain: "Complex setup requiring data engineering", impact: "Medium", segment: "Technical Leads" },
      { pain: "Lack of AI-powered insights", impact: "Medium", segment: "Data Analysts" },
      { pain: "Poor user experience for non-technical users", impact: "High", segment: "Managers" }
    ],
    behaviors: [
      "Uses 3-5 different analytics tools",
      "Spends 20+ hours/week on manual reporting",
      "Evaluates new tools quarterly",
      "Values ease of implementation",
      "Active in product communities"
    ],
    buyingCriteria: [
      "ROI within 90 days",
      "Less than 1 week implementation",
      "Support for existing data stack",
      "Transparent pricing (no surprises)",
      "Strong customer community"
    ],
    decisionMakers: [
      { role: "VP Product", influence: "High", concern: "Feature depth, scalability" },
      { role: "Head of Data", influence: "High", concern: "Data quality, integration, governance" },
      { role: "Finance", influence: "Medium", concern: "Cost, ROI, contract terms" },
      { role: "Product Manager", influence: "High", concern: "Ease of use, time to value" }
    ]
  },

  // Insights Tab
  insights: {
    keyOpportunities: [
      "AI-powered auto-discovery of segments (unaddressed need)",
      "Privacy-first analytics (regulatory tailwind)",
      "Vertical-specific templates (quick wins)",
      "Developer-first API (TAM expansion)"
    ],
    potentialRisks: [
      {
        risk: "Mixpanel/Amplitude could launch cheaper tier",
        probability: "Medium",
        impact: "High",
        mitigation: "Build switching costs through community & integrations"
      },
      {
        risk: "Data storage costs spike with scale",
        probability: "Medium",
        impact: "Medium",
        mitigation: "Invest in data compression, tiered storage"
      },
      {
        risk: "Harder to find skilled data engineers",
        probability: "Medium",
        impact: "Medium",
        mitigation: "Build ops team early, competitive comp"
      }
    ],
    marketGaps: [
      "No solution for <50 person companies (price point gap)",
      "Privacy-first analytics missing in mid-market",
      "No platform that combines analytics with experimentation"
    ],
    growthStrategies: [
      "Vertical expansion: E-commerce templates, SaaS toolkit, Fintech specialization",
      "Platform expansion: Add experimentation, A/B testing, feature flags",
      "Ecosystem: Build partner marketplace, community apps",
      "Land & expand: Start with 1 use case, expand to entire analytics suite"
    ]
  }
};

// Derived numeric data for charts (parsed from the dummy data above)
const ARR_CHART_DATA = [
  { year: "Year 1", arr: 0.5, customers: 45 },
  { year: "Year 2", arr: 2.5, customers: 180 },
  { year: "Year 3", arr: 7.5, customers: 500 },
];

const ARR_CHART_CONFIG = {
  arr: {
    label: "ARR ($M)",
    color: "#10b981",
  },
} satisfies ChartConfig;

const CUSTOMERS_CHART_CONFIG = {
  customers: {
    label: "Customers",
    color: "#0ea5e9",
  },
} satisfies ChartConfig;

const MARKETSHARE_CHART_DATA = [
  { competitor: "Us", share: 275 },
  { competitor: "Mixpanel", share: 200 },
  { competitor: "Amplitude", share: 187 },
  { competitor: "Heap", share: 173 },
  { competitor: "Others", share: 90 },
];

const MARKETSHARE_CHART_CONFIG = {
  share: {
    label: "Market Share",
    color: "#0ea5e9",
  },
  competitor: {
    label: "Competitor",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

const COMPETITOR_CHART_DATA = [
  { category: "Pricing", us: 85, mixpanel: 60, amplitude: 65 },
  { category: "AI Features", us: 95, mixpanel: 50, amplitude: 55 },
  { category: "Ease of Use", us: 80, mixpanel: 70, amplitude: 75 },
  { category: "Integration", us: 90, mixpanel: 85, amplitude: 80 },
  { category: "Support", us: 85, mixpanel: 75, amplitude: 80 },
  { category: "Scalability", us: 90, mixpanel: 88, amplitude: 85 },
];

const COMPETITOR_CHART_CONFIG = {
  us: {
    label: "Us",
    color: "#10b981",
  },
  mixpanel: {
    label: "Mixpanel",
    color: "#3b82f6",
  },
  amplitude: {
    label: "Amplitude",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

function ArrProjectionChart() {
  return (
    <BentoCard title="ARR Projection" icon={TrendingUp} iconClassName="text-green-600" description="3-year recurring revenue ($M)" className="h-full">
      <div className="min-h-[200px] h-full">
        <ChartContainer config={ARR_CHART_CONFIG} className="h-full min-h-[200px] w-full !aspect-auto">
          <AreaChart accessibilityLayer data={ARR_CHART_DATA} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} tickFormatter={(v) => `$${v}M`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <defs>
              <linearGradient id="fillArr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-arr)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-arr)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area dataKey="arr" type="natural" fill="url(#fillArr)" stroke="var(--color-arr)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3">15x ARR growth from Year 1 to Year 3</p>
    </BentoCard>
  );
}

function CustomerGrowthChart() {
  return (
    <BentoCard title="Customer Growth" icon={Users} iconClassName="text-blue-600" description="Projected paying customers" className="h-full">
      <div className="min-h-[200px] h-full">
        <ChartContainer config={CUSTOMERS_CHART_CONFIG} className="h-full min-h-[200px] w-full !aspect-auto">
          <BarChart accessibilityLayer data={ARR_CHART_DATA} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="customers" fill="var(--color-customers)" radius={6} />
          </BarChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Scaling to 500 customers by Year 3</p>
    </BentoCard>
  );
}

function MarketShareTile() {
  return (
    <BentoCard title="Market Share" icon={BarChart3} iconClassName="text-blue-600" description="2024 Analytics Platform Market" className="h-full">
      <div className="min-h-[200px] h-full">
        <ChartContainer config={MARKETSHARE_CHART_CONFIG} className="h-full min-h-[200px] w-full !aspect-auto">
          <BarChart accessibilityLayer data={MARKETSHARE_CHART_DATA} layout="vertical" margin={{ right: 16 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="competitor" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
            <XAxis dataKey="share" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="share" fill="var(--color-share)" radius={4}>
              <LabelList dataKey="competitor" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
              <LabelList dataKey="share" position="right" offset={8} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Showing market share by top competitors</p>
    </BentoCard>
  );
}

function CompetitorRadarTile() {
  return (
    <BentoCard title="Competitor Analysis" icon={Target} iconClassName="text-green-600" description="Performance comparison across key metrics" className="h-full">
      <div className="min-h-[200px] h-full">
        <ChartContainer config={COMPETITOR_CHART_CONFIG} className="mx-auto aspect-square w-full">
          <RadarChart data={COMPETITOR_CHART_DATA}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar name="Us" dataKey="us" stroke="#10b981" fill="#10b981" fillOpacity={0.6} dot={{ r: 4, fillOpacity: 1 }} />
            <Radar name="Mixpanel" dataKey="mixpanel" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} dot={{ r: 3, fillOpacity: 0.8 }} />
            <Radar name="Amplitude" dataKey="amplitude" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} dot={{ r: 3, fillOpacity: 0.8 }} />
          </RadarChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Competitive advantage across 6 key dimensions</p>
    </BentoCard>
  );
}

type TabType = "overview" | "strategy" | "market" | "icp" | "product" | "financial" | "execution";

export default function ProductBoardPage() {
  const [boardGenerated, setBoardGenerated] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<Record<string, string>>({
    productName: "",
    industry: "",
    targetMarket: "",
    vision: "",
    keyFeatures: "",
  });

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBoardGenerated(true);
      setCreateModalOpen(false);
      setFormData({
        productName: "",
        industry: "",
        targetMarket: "",
        vision: "",
        keyFeatures: "",
      });
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const isFormValid = Boolean(formData.productName && formData.industry);

  if (!boardGenerated) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Product Board</h1>
            <p className="text-muted-foreground">
              Generate a comprehensive product board with market analysis, strategy, and execution plan
            </p>
          </div>

          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>Ready to create a Product Board?</EmptyTitle>
              <EmptyDescription>
                Share your product vision and let AI generate a complete board including strategy, market analysis, financials, and execution plan.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="lg" onClick={() => setCreateModalOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create Product Board
              </Button>
            </EmptyContent>
          </Empty>
        </div>

        <CreateProductModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          title="Start Creating Product Board"
          description="Provide some basic information about your product. We'll generate a comprehensive product board."
          submitLabel="Create Product Board"
          fields={CREATE_FIELDS}
          formData={formData}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          isValid={isFormValid}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{DUMMY_PRODUCT_BOARD.productName}</h1>
            <p className="text-muted-foreground text-sm">
              Status: <Badge className="ml-2">{DUMMY_PRODUCT_BOARD.status}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setBoardGenerated(false)}>
              <Plus className="h-4 w-4" />
              New Board
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={(val) => setActiveTab(val as TabType)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Strategy</span>
              </TabsTrigger>
              <TabsTrigger value="market" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Market</span>
              </TabsTrigger>
              <TabsTrigger value="icp" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">ICP</span>
              </TabsTrigger>
              <TabsTrigger value="product" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Product</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Financial</span>
              </TabsTrigger>
              <TabsTrigger value="execution" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Execution</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto flex justify-center">
              <div className="w-full max-w-4xl px-4">
              {/* Overview Tab - Bento Grid */}
              <TabsContent value="overview" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* Executive Summary */}
                  <BentoCard title="Executive Summary" icon={Target} iconClassName="text-blue-600" className="lg:col-span-4 lg:row-span-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {DUMMY_PRODUCT_BOARD.overview.executiveSummary}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge variant="outline">{DUMMY_PRODUCT_BOARD.status}</Badge>
                      <Badge variant="outline">{DUMMY_PRODUCT_BOARD.overview.keyMetrics.marketSize}</Badge>
                      <Badge variant="outline">{DUMMY_PRODUCT_BOARD.overview.keyMetrics.growthRate}</Badge>
                    </div>
                  </BentoCard>

                  {/* Key Metric stat cards */}
                  {Object.entries(DUMMY_PRODUCT_BOARD.overview.keyMetrics).map(([key, value]) => (
                    <div key={key} className="lg:col-span-1 rounded-lg border bg-card p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-base font-bold leading-tight">{value}</p>
                    </div>
                  ))}

                  {/* Timeline stepper */}
                  <BentoCard title="Timeline" icon={Calendar} iconClassName="text-blue-600" className="lg:col-span-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(DUMMY_PRODUCT_BOARD.overview.timeline).map(([phase, date], idx, arr) => (
                        <div key={phase} className="relative pl-6">
                          <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                          {idx < arr.length - 1 && (
                            <span className="absolute left-[5px] top-4 hidden lg:block h-0.5 w-[calc(100%+1rem)] bg-blue-200 dark:bg-blue-900" />
                          )}
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{phase.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm font-bold">{date}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              {/* Strategy Tab - Bento Grid */}
              <TabsContent value="strategy" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* Vision */}
                  <BentoCard title="Vision" icon={Compass} iconClassName="text-purple-600" className="lg:col-span-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {DUMMY_PRODUCT_BOARD.strategy.vision}
                    </p>
                  </BentoCard>

                  {/* Mission */}
                  <BentoCard title="Mission Statement" icon={Rocket} iconClassName="text-blue-600" className="lg:col-span-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {DUMMY_PRODUCT_BOARD.strategy.missionStatement}
                    </p>
                  </BentoCard>

                  {/* KPI stat cards */}
                  {Object.entries(DUMMY_PRODUCT_BOARD.strategy.kpis).map(([metric, value]) => (
                    <div key={metric} className="lg:col-span-2 rounded-lg border bg-card p-6 hover:shadow-md transition-shadow text-center">
                      <p className="text-2xl font-bold mb-1">{value}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{metric.replace(/_/g, ' ')}</p>
                    </div>
                  ))}

                  {/* GTM Strategy */}
                  <BentoCard title="Go-to-Market Strategy" icon={Zap} iconClassName="text-amber-600" className="lg:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold mb-3">Channels</h4>
                        <ul className="space-y-2">
                          {DUMMY_PRODUCT_BOARD.strategy.gtmStrategy.channels.map((channel, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-600 font-bold">→</span>
                              <span>{channel}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold mb-3">Target Segments</h4>
                        <ul className="space-y-2">
                          {DUMMY_PRODUCT_BOARD.strategy.gtmStrategy.targetSegments.map((segment, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-600 font-bold">◆</span>
                              <span>{segment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </BentoCard>

                  {/* Positioning highlight */}
                  <div className="lg:col-span-2 rounded-lg border bg-card p-6 hover:shadow-md transition-shadow flex flex-col justify-center">
                    <h4 className="text-sm font-bold mb-2">Positioning</h4>
                    <p className="text-lg font-semibold text-purple-600 leading-snug">{DUMMY_PRODUCT_BOARD.strategy.gtmStrategy.positioning}</p>
                  </div>

                  {/* Competitive Positioning */}
                  <BentoCard title="Competitive Positioning" icon={BarChart3} iconClassName="text-purple-600" className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(DUMMY_PRODUCT_BOARD.strategy.competitivePositioning).map(([competitor, position]) => (
                        <div key={competitor} className="border rounded-lg p-4">
                          <p className="text-sm font-bold mb-2 capitalize">{competitor.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">{position}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Strategic Insights divider */}
                  <div className="lg:col-span-6 mt-2"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Strategic Insights</h2></div>

                  {/* Key Opportunities */}
                  <BentoCard title="Key Opportunities" icon={Lightbulb} iconClassName="text-green-600" className="lg:col-span-3">
                    <ul className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.insights.keyOpportunities.map((opp, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <span className="text-green-600 font-bold">✦</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Growth Strategies */}
                  <BentoCard title="Growth Strategies" icon={ArrowUpRight} iconClassName="text-purple-600" className="lg:col-span-3">
                    <ul className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.insights.growthStrategies.map((strategy, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <span className="text-purple-600 font-bold">→</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Market Gaps */}
                  <BentoCard title="Market Gaps" icon={Target} iconClassName="text-blue-600" className="lg:col-span-2">
                    <ul className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.insights.marketGaps.map((gap, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <span className="text-blue-600 font-bold">◇</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Potential Risks */}
                  <BentoCard title="Potential Risks" icon={ShieldAlert} iconClassName="text-red-600" className="lg:col-span-4">
                    <div className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.insights.potentialRisks.map((risk, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{risk.risk}</h4>
                            <div className="flex gap-2 shrink-0">
                              <Badge variant="secondary">{risk.probability} prob</Badge>
                              <Badge variant="destructive">{risk.impact} impact</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              {/* ICP Tab - Bento Grid */}
              <TabsContent value="icp" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* ICP Card - User Profile Component (same as Docs page) */}
                  <div className="lg:col-span-3 lg:row-span-2 rounded-lg border hover:shadow-md transition-shadow relative overflow-hidden">
                    {/* Background Shader */}
                    <div className="absolute inset-0 z-0">
                      <MeshGradient
                        style={{ height: "100%", width: "100%" }}
                        distortion={0.8}
                        swirl={0.1}
                        offsetX={0}
                        offsetY={0}
                        scale={1}
                        rotation={0}
                        speed={1}
                        colors={["hsl(216, 30%, 10%)", "hsl(243, 25%, 30%)", "hsl(205, 20%, 35%)", "hsl(211, 20%, 13%)"]}
                      />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center">
                      <div className="w-full [&_div.container]:!py-6 [&_div.container]:!px-4 [&_div.mx-auto]:!max-w-none">
                        <SimpleUserProfile />
                      </div>
                    </div>
                  </div>

                  {/* Firmographics */}
                  <BentoCard title="Firmographics" icon={Building2} className="lg:col-span-3">
                    <div className="grid grid-cols-2 gap-3">
                      {DUMMY_PRODUCT_BOARD.icp.firmographics.map((firm, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{firm.label}</p>
                          <p className="text-sm font-semibold">{firm.value}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Customer Behaviors */}
                  <BentoCard title="Customer Behaviors" icon={Users} iconClassName="text-blue-600" className="lg:col-span-3">
                    <ul className="space-y-2">
                      {DUMMY_PRODUCT_BOARD.icp.behaviors.map((behavior, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{behavior}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Pain Points */}
                  <BentoCard title="Primary Pain Points" icon={AlertCircle} iconClassName="text-red-600" className="lg:col-span-4">
                    <div className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.icp.painPoints.map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h4 className="font-semibold">{item.pain}</h4>
                            <Badge variant={item.impact === 'High' ? 'destructive' : 'secondary'} className="shrink-0">
                              {item.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Key for: {item.segment}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Buying Criteria */}
                  <BentoCard title="Buying Criteria" icon={CheckCircle2} iconClassName="text-green-600" className="lg:col-span-2">
                    <ul className="space-y-2">
                      {DUMMY_PRODUCT_BOARD.icp.buyingCriteria.map((criteria, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Decision Makers */}
                  <BentoCard title="Key Decision Makers" icon={Users} iconClassName="text-purple-600" className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {DUMMY_PRODUCT_BOARD.icp.decisionMakers.map((maker, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <h4 className="font-semibold">{maker.role}</h4>
                            <Badge variant={maker.influence === 'High' ? 'default' : 'secondary'} className="shrink-0">
                              {maker.influence}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{maker.concern}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Target Personas */}
                  {DUMMY_PRODUCT_BOARD.marketAnalysis.targetCustomerPersonas.map((persona, idx) => (
                    <BentoCard key={idx} title={persona.name} icon={Users} iconClassName="text-blue-600" className="lg:col-span-3">
                      <div className="flex justify-end mb-3">
                        <Badge variant="secondary" className="shrink-0">{persona.budget}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Company:</span> {persona.company}</p>
                        <p><span className="font-medium text-foreground">Pain Points:</span> {persona.pain_points}</p>
                        <p><span className="font-medium text-foreground">Goals:</span> {persona.goals}</p>
                      </div>
                    </BentoCard>
                  ))}
                </div>
              </TabsContent>

              {/* Market Analysis Tab - Bento Grid */}
              <TabsContent value="market" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* TAM/SAM/SOM funnel */}
                  <BentoCard title="Market Size" icon={Target} iconClassName="text-green-600" className="lg:col-span-2">
                    <div className="space-y-3">
                      {Object.entries(DUMMY_PRODUCT_BOARD.marketAnalysis.tam).map(([segment, value], idx) => (
                        <div
                          key={segment}
                          className="rounded-lg bg-green-50 dark:bg-green-950 p-3 mx-auto text-center"
                          style={{ width: `${100 - idx * 18}%` }}
                        >
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{segment}</p>
                          <p className="text-xl font-bold text-green-600">{value}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Market Share chart */}
                  <div className="lg:col-span-2">
                    <MarketShareTile />
                  </div>

                  {/* Competitor Analysis radar chart */}
                  <div className="lg:col-span-2">
                    <CompetitorRadarTile />
                  </div>

                  {/* Market Trends */}
                  <BentoCard title="Market Trends" icon={TrendingUp} iconClassName="text-orange-600" className="lg:col-span-2 lg:row-span-2">
                    <div className="space-y-3">
                      {DUMMY_PRODUCT_BOARD.marketAnalysis.marketTrends.map((trend, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                          <span className="text-orange-600 font-bold">⬆</span>
                          <span className="text-sm text-muted-foreground">{trend}</span>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Competitive Landscape */}
                  <BentoCard title="Competitive Landscape" icon={BarChart3} iconClassName="text-purple-600" className="lg:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DUMMY_PRODUCT_BOARD.marketAnalysis.competitiveLandscape.map((competitor, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{competitor.name}</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-green-600 mb-0.5">STRENGTH</p>
                              <p className="text-muted-foreground">{competitor.strength}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-600 mb-0.5">WEAKNESS</p>
                              <p className="text-muted-foreground">{competitor.weakness}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              {/* Product Definition Tab - Bento Grid */}
              <TabsContent value="product" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* Value Proposition hero */}
                  <BentoCard title="Value Proposition" icon={Sparkles} iconClassName="text-green-600" className="lg:col-span-6">
                    <p className="text-2xl font-bold text-green-600 leading-snug">
                      {DUMMY_PRODUCT_BOARD.productDefinition.valueProposition}
                    </p>
                  </BentoCard>

                  {/* Core Features */}
                  <BentoCard title="Core Features" icon={ListChecks} className="lg:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DUMMY_PRODUCT_BOARD.productDefinition.coreFeatures.map((feature, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{feature.name}</h4>
                            <Badge variant={feature.priority === 'P0' ? 'default' : 'secondary'} className="shrink-0">
                              {feature.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.userValue}</p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Jobs to be Done */}
                  <BentoCard title="Jobs to be Done" icon={Target} iconClassName="text-blue-600" className="lg:col-span-2">
                    <ul className="space-y-2">
                      {DUMMY_PRODUCT_BOARD.productDefinition.jobsToBeDone.map((job, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 font-bold">✓</span>
                          <span>{job}</span>
                        </li>
                      ))}
                    </ul>
                  </BentoCard>

                  {/* Success Criteria */}
                  <BentoCard title="Success Criteria" icon={CheckCircle2} iconClassName="text-purple-600" className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DUMMY_PRODUCT_BOARD.productDefinition.successCriteria.map((criteria, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2 rounded-lg bg-purple-50 dark:bg-purple-950 p-3">
                          <span className="text-purple-600 font-bold">→</span>
                          <span>{criteria}</span>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              {/* Financial Tab - Bento Grid */}
              <TabsContent value="financial" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* Unit economics stat cards */}
                  {Object.entries(DUMMY_PRODUCT_BOARD.financial.unitEconomics).map(([metric, value]) => (
                    <div key={metric} className="lg:col-span-2 rounded-lg border bg-card p-6 hover:shadow-md transition-shadow text-center">
                      <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold mb-1">{value}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{metric.replace(/_/g, ' ')}</p>
                    </div>
                  ))}

                  {/* ARR projection chart */}
                  <div className="lg:col-span-3">
                    <ArrProjectionChart />
                  </div>

                  {/* Customer growth chart */}
                  <div className="lg:col-span-3">
                    <CustomerGrowthChart />
                  </div>

                  {/* Revenue model + pricing tiers */}
                  <BentoCard title="Revenue Model & Pricing" icon={DollarSign} iconClassName="text-green-600" description={DUMMY_PRODUCT_BOARD.financial.revenueModel} className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(DUMMY_PRODUCT_BOARD.financial.pricingStrategy).map(([tier, details], idx) => (
                        <div key={tier} className={`border rounded-lg p-5 ${idx === 1 ? 'ring-2 ring-green-500/40' : ''}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold capitalize">{tier}</h4>
                            {idx === 1 && <Badge>Popular</Badge>}
                          </div>
                          <p className="text-2xl font-bold mb-4">{details.price}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Seats</span>
                              <span className="font-semibold">{details.seats}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Monthly Events</span>
                              <span className="font-semibold">{details.monthlyEvents}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Financial Projections detail */}
                  <BentoCard title="Financial Projections" icon={TrendingUp} iconClassName="text-green-600" className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(DUMMY_PRODUCT_BOARD.financial.financialProjections).map(([year, metrics]) => (
                        <div key={year} className="border rounded-lg p-4">
                          <h4 className="font-bold mb-4 capitalize">{year.replace(/([a-z])([0-9])/g, '$1 $2')}</h4>
                          <div className="space-y-3">
                            {Object.entries(metrics).map(([metric, value]) => (
                              <div key={metric} className="flex justify-between items-baseline">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">{metric.replace(/_/g, ' ')}</p>
                                <p className="text-sm font-bold">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              {/* Execution Tab - Bento Grid */}
              <TabsContent value="execution" className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-min gap-4">
                  {/* Phases - vertical timeline */}
                  <BentoCard title="Development Phases" icon={Calendar} iconClassName="text-blue-600" className="lg:col-span-4">
                    <div className="space-y-6">
                      {DUMMY_PRODUCT_BOARD.execution.phases.map((phase, idx, arr) => (
                        <div key={idx} className="relative pl-8">
                          <span className="absolute left-0 top-1 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                          {idx < arr.length - 1 && (
                            <span className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-0.5 bg-blue-200 dark:bg-blue-900" />
                          )}
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <h4 className="font-bold">{phase.phase}</h4>
                            <Badge variant="secondary">{phase.timeline}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">MILESTONES</p>
                              <ul className="space-y-1">
                                {phase.milestones.map((milestone, midx) => (
                                  <li key={midx} className="text-sm text-muted-foreground">• {milestone}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">RESOURCES</p>
                              <p className="text-sm text-muted-foreground">{phase.resources}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Dependencies + Launch Checklist stacked */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <BentoCard title="Dependencies" icon={ListChecks} iconClassName="text-amber-600">
                      <ul className="space-y-2">
                        {DUMMY_PRODUCT_BOARD.execution.dependencies.map((dep, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-yellow-600 font-bold">⚠</span>
                            <span>{dep}</span>
                          </li>
                        ))}
                      </ul>
                    </BentoCard>

                    <BentoCard title="Launch Checklist" icon={CheckCircle2} iconClassName="text-green-600">
                      <ul className="space-y-2">
                        {DUMMY_PRODUCT_BOARD.execution.launchChecklist.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </BentoCard>
                  </div>

                  {/* Risks */}
                  <BentoCard title="Risks & Mitigations" icon={ShieldAlert} iconClassName="text-red-600" className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {DUMMY_PRODUCT_BOARD.execution.risks.map((risk, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <h4 className="font-semibold flex-1 text-sm">{risk.risk}</h4>
                            <Badge variant={risk.impact === 'High' ? 'destructive' : 'secondary'} className="shrink-0">
                              {risk.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                </div>
              </TabsContent>

              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
