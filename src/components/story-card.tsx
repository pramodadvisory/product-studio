"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

export interface StoryCardProps {
  id?: string;
  title: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  assignee?: string;
  storyPoints?: number;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function getPriorityVariant(priority?: string) {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "todo":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return "To Do";
  }
}

export function StoryCard({
  title,
  description,
  status = "todo",
  priority,
  assignee,
  storyPoints,
}: StoryCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
          {getStatusIcon(status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {priority && (
            <Badge variant={getPriorityVariant(priority)} className="text-xs">
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Badge>
          )}
          {status && (
            <Badge variant="outline" className="text-xs">
              {getStatusLabel(status)}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {assignee && (
            <span className="truncate">
              👤 {assignee}
            </span>
          )}
          {storyPoints && (
            <span className="ml-auto font-semibold text-primary">
              {storyPoints} pts
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
