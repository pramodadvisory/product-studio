"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Empty } from "@/components/ui/empty";

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tasks</h1>
            <p className="text-muted-foreground">
              Manage your tasks and activities
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Empty State */}
        <Empty />
      </div>
    </div>
  );
}
