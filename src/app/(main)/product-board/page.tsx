"use client";

import { useMemo, useState } from "react";
import { useHeaderTitle, HeaderActions } from "@/components/header-title-context";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Download,
  Share2,
  AlertCircle,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProductModal, type CreateModalField } from "@/components/create-product-modal";
import { BlockRenderer } from "@/components/product-board/blocks";
import {
  GroupRail,
  anchorId,
  useActiveSection,
  type Density,
} from "@/components/product-board/board-chrome";
import { EditableText } from "@/components/product-board/editable";
import { SEED_BOARD } from "@/lib/product-board/seed";
import {
  SIZE_CLASS,
  sectionBlocks,
  type Block,
  type BlockSize,
} from "@/lib/product-board/schema";
import { useBoard } from "@/lib/product-board/use-board";

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

/** Tab icons live here rather than in the schema — they're chrome, not content. */
const SECTION_ICONS: Record<string, typeof Sparkles> = {
  problem: AlertCircle,
  solution: Sparkles,
  market: BarChart3,
  outcome: Target,
  progress: Calendar,
};

export default function ProductBoardPage() {
  const [boardGenerated, setBoardGenerated] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [density] = useState<Density>("full");
  const [activeTab, setActiveTab] = useState("problem");
  // State, not a ref — the scroll-spy effect must re-arm when this node mounts.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  const { board, mutate, mutateBlock } = useBoard(SEED_BOARD);

  useHeaderTitle(boardGenerated && board ? board.productName : "Product Board");

  const [formData, setFormData] = useState<Record<string, string>>({
    productName: "",
    industry: "",
    targetMarket: "",
    vision: "",
    keyFeatures: "",
  });

  const isVisible = (block: Block) => density === "full" || block.inSummary === true;

  // Summary shows far fewer blocks, so the authored sizes would leave ragged
  // empty gutters. Widen everything one step so rows still close.
  const effectiveSize = (block: Block): BlockSize => {
    if (density === "full") return block.size;
    return block.size === "third" || block.size === "half" ? "half" : "full";
  };

  const currentSection = board?.sections.find((s) => s.id === activeTab) ?? board?.sections[0];

  // Groups of the *active* tab only — that's what the rail lists and scroll-spies.
  const railGroups = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.groups
      .map((g) => ({ id: g.id, title: g.title, count: g.blocks.filter(isVisible).length }))
      .filter((g) => g.count > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, density]);

  const railIds = useMemo(() => railGroups.map((g) => g.id), [railGroups]);
  const activeGroup = useActiveSection(railIds, scrollEl);

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Carry what the user typed into the board they're about to see.
      if (formData.productName) {
        mutate((draft) => {
          draft.productName = formData.productName;
        });
      }
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
        <div className="flex flex-1 flex-col overflow-hidden p-4 lg:p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>Ready to create a Product Board?</EmptyTitle>
              <EmptyDescription>
                Share your product vision and let AI generate a complete board covering the
                problem, the solution, the outcome, and the progress. Every field stays
                editable afterwards.
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

  if (!board) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-xl lg:col-span-2" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    /*
      Height must be bounded here or the inner overflow-y-auto pane just grows to
      fit its content, the document scrolls instead, and `position: sticky` has
      nowhere to travel. The shell gives us --header-height; `variant="inset"`
      adds m-2 (1rem vertical) at md and up.
    */
    <div className="flex h-[calc(100svh-var(--header-height))] overflow-hidden md:h-[calc(100svh-var(--header-height)-1rem)]">
      <HeaderActions>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </HeaderActions>

      {/*
        Two levels of navigation, one on each flank: the left rail switches
        sections, the right rail jumps between the groups inside the active one.
        Both sit outside — or sticky within — the scrolling column, so they stay
        reachable from any scroll position.
      */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="flex min-h-0 w-full gap-0"
      >
        {/*
          Its own scroll context: a long section list must never push the board
          column's height around. Icon-only until md, so the tabs stay reachable
          on narrow screens instead of disappearing with the labels.
        */}
        <div className="w-14 shrink-0 overflow-y-auto border-r px-2 py-6 md:w-56 md:px-3">
          <p className="mb-2 hidden pl-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/55 md:block">
            Sections
          </p>
          <TabsList className="w-full gap-1">
            {board.sections.map((section) => {
              const Icon = SECTION_ICONS[section.id] ?? Sparkles;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  title={section.title}
                  className="h-auto justify-center gap-2 px-2 py-2 md:justify-start md:px-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden truncate md:inline">{section.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div ref={setScrollEl} className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
            {board.sections.map((section) => {
              const groups = section.groups
                .map((g) => ({ group: g, blocks: g.blocks.filter(isVisible) }))
                .filter((g) => g.blocks.length > 0);

              return (
                <TabsContent key={section.id} value={section.id}>
                  <div className="flex gap-8">
                    <div className="min-w-0 flex-1">
                      {groups.length ? (
                        <div className="space-y-10">
                          {groups.map(({ group, blocks }) => (
                            <section
                              key={group.id}
                              id={anchorId(group.id)}
                              className="scroll-mt-6"
                            >
                              <div className="mb-5 border-b pb-3">
                                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                  {group.title}
                                </h3>
                                <EditableText
                                  label={`${group.title} description`}
                                  value={group.description}
                                  onCommit={(description) =>
                                    mutate((draft) => {
                                      const targetSection = draft.sections.find(
                                        (s) => s.id === section.id
                                      );
                                      const targetGroup = targetSection?.groups.find(
                                        (g) => g.id === group.id
                                      );
                                      if (targetGroup) targetGroup.description = description;
                                    })
                                  }
                                  className="mt-1 text-sm text-foreground"
                                />
                              </div>
                              <div className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-6">
                                {blocks.map((block) => (
                                  <div
                                    key={block.id}
                                    className={SIZE_CLASS[effectiveSize(block)]}
                                  >
                                    <BlockRenderer
                                      block={block}
                                      mutateBlock={mutateBlock}
                                    />
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/70">
                          Nothing in this section is marked for the summary view — switch to
                          Full to see all {sectionBlocks(section).length} blocks.
                        </p>
                      )}
                    </div>

                    <GroupRail
                      groups={groups.map(({ group, blocks }) => ({
                        id: group.id,
                        title: group.title,
                        count: blocks.length,
                      }))}
                      activeId={activeGroup}
                      density={density}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
