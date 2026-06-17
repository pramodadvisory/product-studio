"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";

export default function DocsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Documentation</h1>
            <p className="text-muted-foreground">
              Browse your project documentation and resources
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>

        {/* Empty State */}
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any documents yet.
              Get started by creating your first document.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
            <Button variant="outline">Import Document</Button>
          </EmptyContent>
          <a href="#" className="text-muted-foreground text-sm hover:text-primary">
            Learn More
          </a>
        </Empty>
      </div>
    </div>
  );
}
