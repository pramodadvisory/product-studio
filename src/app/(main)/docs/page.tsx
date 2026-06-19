"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Edit2, Download, Share2, Plus } from "lucide-react";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { MeshGradient } from "@paper-design/shaders-react";
import SimpleUserProfile from "@/components/blocks/application/user-profiles/simple";
import { CompetitorAnalysisChart } from "@/components/charts/competitor-analysis-chart";
import { MarketshareChart } from "@/components/charts/marketshare";
import { CreateProductModal, type CreateModalField } from "@/components/create-product-modal";

const INDUSTRIES = [
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
];

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
    options: INDUSTRIES,
  },
  {
    name: "targetUsers",
    label: "Who is it for?",
    placeholder: "e.g., Marketing teams, Product managers",
    type: "input",
  },
  {
    name: "purpose",
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

const DUMMY_DOCS = {
  id: "doc-1",
  productName: "Customer Analytics Platform",
  createdAt: "2024-06-17",
  targetICP: "Mid-market B2B SaaS companies (50-500 employees) with annual revenue $5M-$50M",
  problemStatement: "Product teams struggle to understand customer behavior across touchpoints, leading to poor product decisions and missed growth opportunities.",
  industry: "SaaS",
  featureList: [
    "Real-time customer event tracking",
    "Behavioral cohort analysis",
    "Predictive churn modeling",
    "Customizable dashboards",
    "API-first architecture",
    "Integration with 50+ tools"
  ],
  marketAnalysis: "The analytics market is experiencing rapid growth with increasing demand for intelligent, user-friendly platforms. Companies are looking for solutions that can provide actionable insights without requiring extensive technical setup.",
  keyCompetitors: [
    { name: "Mixpanel", strength: "Large user base", weakness: "High pricing" },
    { name: "Amplitude", strength: "Advanced analytics", weakness: "Steep learning curve" },
    { name: "Heap", strength: "Auto-capture", weakness: "Limited AI features" }
  ],
  goals: [
    "Acquire 100 new customers in Year 1",
    "Achieve 85% customer retention rate",
    "Reach $500K ARR by end of Year 1",
    "Establish market presence in 3 key verticals"
  ],
  successMetrics: {
    "Monthly Active Users": "500+",
    "Customer Retention": "85%+",
    "Net Revenue Retention": "110%+",
    "Time to Value": "<15 minutes"
  }
};

type DocSection = keyof typeof DUMMY_DOCS;

export default function DocsPage() {
  const [docsGenerated, setDocsGenerated] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<DocSection | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    productName: "",
    industry: "",
    targetUsers: "",
    purpose: "",
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
    const isLoading = true;

    try {
      // TODO: Call API to generate documentation
      console.log("Creating docs with:", formData);
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDocsGenerated(true);
      setCreateModalOpen(false);
      setFormData({
        productName: "",
        targetUsers: "",
        purpose: "",
        keyFeatures: "",
        industry: "",
      });
    } catch (error) {
      console.error("Error creating docs:", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditLoading(true);

    try {
      // TODO: Call API to refine documentation with AI
      console.log(`Refining ${editingSection} with prompt:`, editPrompt);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setEditModalOpen(false);
      setEditPrompt("");
      setEditingSection(null);
    } catch (error) {
      console.error("Error editing docs:", error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const isFormValid = Boolean(formData.productName && formData.industry);

  if (!docsGenerated) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Documentation</h1>
            <p className="text-muted-foreground">
              Generate comprehensive documentation for your product
            </p>
          </div>

          {/* Empty State */}
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>Ready to create documentation?</EmptyTitle>
              <EmptyDescription>
                Generate complete documentation including PRD, BRD, goals, epics,
                stories, and tasks with just a few details about your product.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="lg" onClick={() => setCreateModalOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start Creating Docs
              </Button>
            </EmptyContent>
          </Empty>
        </div>

        {/* Create Docs Modal */}
        <CreateProductModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          title="Start Creating Documentation"
          description="Provide some basic information about your product. We'll generate comprehensive documentation."
          submitLabel="Create Documentation"
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold mb-2 uppercase">{DUMMY_DOCS.productName}</h1>
            <p className="text-muted-foreground text-sm">
              Generated on {new Date(DUMMY_DOCS.createdAt).toLocaleDateString()}
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
            <Button size="sm" className="gap-2" onClick={() => { setDocsGenerated(false); setCreateModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              New Doc
            </Button>
          </div>
        </div>

        {/* Simple Grid Layout */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-4xl px-4 grid grid-cols-5 gap-4">
            {/* Target ICP - User Profile Component */}
            <div className="rounded-lg border hover:shadow-md transition-shadow relative group overflow-hidden col-span-3">
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
              <div className="relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection("targetICP");
                    setEditModalOpen(true);
                  }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-4 w-4 text-white" />
                </Button>
                <div className="[&_div.container]:!py-6 [&_div.container]:!px-4 [&_div.mx-auto]:!max-w-none">
                  <SimpleUserProfile />
                </div>
              </div>
            </div>

            {/* Problem Statement + Market Analysis Wrapper */}
            <div className="space-y-4 col-span-2">
                {/* Problem Statement & Industry */}
                <div className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow relative group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Problem Statement</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection("problemStatement");
                    setEditModalOpen(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Problem</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DUMMY_DOCS.problemStatement}
                  </p>
                </div>

                {/* Severity Chart */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Impact Areas</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Productivity Loss</span>
                        <span className="text-xs font-semibold text-red-600">92%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Cost Impact</span>
                        <span className="text-xs font-semibold text-orange-600">78%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">User Satisfaction</span>
                        <span className="text-xs font-semibold text-yellow-600">65%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Industry</p>
                  <Badge>{DUMMY_DOCS.industry}</Badge>
                </div>
              </div>
              </div>

              {/* Market Analysis */}
              <div className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow relative group">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSection("marketAnalysis");
                      setEditModalOpen(true);
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Market Analysis</h3>
                  </div>

                  {/* Core Market Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6 border-y border-border py-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">TAM</p>
                      <p className="text-base font-semibold">$8.5B</p>
                    </div>
                    <div className="border-l border-border pl-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Growth Rate</p>
                      <p className="text-base font-semibold">12% CAGR</p>
                    </div>
                  </div>

                  {/* Top Competitors */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Competitors</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">Mixpanel</Badge>
                      <Badge variant="outline">Amplitude</Badge>
                    </div>
                  </div>

                {/* Market Content */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {DUMMY_DOCS.marketAnalysis}
                </p>
              </div>
            </div>

            {/* Market Share Chart */}
            <div className="col-span-2">
              <MarketshareChart />
            </div>

            {/* Competitor Analysis - Spider Chart */}
            <div className="col-span-3">
              <CompetitorAnalysisChart />
            </div>

            {/* Features vs Scope Card */}
            <div className="col-span-5 rounded-lg border bg-card p-6 hover:shadow-md transition-shadow relative group">
              <h3 className="text-lg font-semibold mb-6">Scope & Competitive Analysis</h3>

              <div className="grid grid-cols-3 gap-6">
                {/* Features */}
                <div>
                  <h4 className="text-sm font-bold mb-3 pb-2 border-b border-border">Features</h4>
                  <ul className="space-y-2">
                    {DUMMY_DOCS.featureList.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Out of Scope */}
                <div>
                  <h4 className="text-sm font-bold mb-3 pb-2 border-b border-border">Out of Scope</h4>
                  <ul className="space-y-2">
                    {[
                      "Custom development services",
                      "Phone support",
                      "White-label solutions",
                      "Legacy system integration"
                    ].map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-600 font-bold mt-0.5">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Competitors Don't Have */}
                <div>
                  <h4 className="text-sm font-bold mb-3 pb-2 border-b border-border">Our Unique Advantages</h4>
                  <ul className="space-y-2">
                    {[
                      "AI-powered insights",
                      "40% lower pricing",
                      "Real-time collaboration",
                      "Zero setup time",
                      "Natural language queries"
                    ].map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">★</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refine with AI</DialogTitle>
            <DialogDescription>
              Tell the AI how you&apos;d like to refine this section.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPrompt">Your refinement request</Label>
              <textarea
                id="editPrompt"
                placeholder="e.g., Make this more technical, Simplify for non-technical users, Add more details about..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={isEditLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditLoading}>
                {isEditLoading ? "Refining..." : "Refine Content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
