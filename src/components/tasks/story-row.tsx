"use client";

import {
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditableLine,
  EditableNumber,
  RemoveButton,
} from "@/components/product-board/editable";
import { cn } from "@/lib/utils";
import {
  STORY_STATUS_LABEL,
  STORY_STATUSES,
  type StoryItem,
  type StoryStatus,
} from "@/app/(main)/tasks/tasks";

/**
 * One delivery story under an experiment.
 *
 * The shape is `StoryItem` from the story map, unchanged — a story written here
 * is a story that board could render as-is.
 */
const STATUS_ICON: Record<
  StoryStatus,
  { Icon: typeof CircleIcon; className: string }
> = {
  todo: { Icon: CircleIcon, className: "text-muted-foreground/60" },
  "in-progress": {
    Icon: CircleDashedIcon,
    className: "text-amber-600 dark:text-amber-400",
  },
  done: {
    Icon: CircleCheckIcon,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  blocked: { Icon: BanIcon, className: "text-rose-600 dark:text-rose-400" },
};

const PRIORITIES = ["high", "medium", "low"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_TONE: Record<Priority, string> = {
  high: "text-rose-600 dark:text-rose-400",
  medium: "text-muted-foreground",
  low: "text-muted-foreground/60",
};

export function StoryRow({
  story,
  onChange,
  onDelete,
}: {
  story: StoryItem;
  onChange: (patch: Partial<Omit<StoryItem, "id">>) => void;
  onDelete: () => void;
}) {
  const status = (story.status ?? "todo") as StoryStatus;
  const priority = (story.priority ?? "medium") as Priority;
  const { Icon, className: iconClass } = STATUS_ICON[status];
  const done = status === "done";

  return (
    <div className="group/row flex items-center gap-2 rounded-md py-1 pr-1 pl-1 transition-colors hover:bg-foreground/[0.03]">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Status: ${STORY_STATUS_LABEL[status]}`}
          title={STORY_STATUS_LABEL[status]}
          render={
            <button
              type="button"
              className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          }
        >
          <Icon className={cn("size-4", iconClass)} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-36">
          {STORY_STATUSES.map((option) => {
            const OptionIcon = STATUS_ICON[option].Icon;
            return (
              <DropdownMenuItem
                key={option}
                onClick={() => onChange({ status: option })}
                className={cn(option === status && "font-medium")}
              >
                <OptionIcon
                  className={cn("size-3.5", STATUS_ICON[option].className)}
                />
                {STORY_STATUS_LABEL[option]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {story.storyKey && (
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
          {story.storyKey}
        </span>
      )}

      <EditableLine
        value={story.text}
        onCommit={(text) => onChange({ text })}
        label="Story"
        placeholder="Describe the work…"
        className={cn(
          "text-sm",
          done && "text-muted-foreground line-through decoration-muted-foreground/40"
        )}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Priority: ${priority}`}
          render={
            <button
              type="button"
              className={cn(
                "hidden shrink-0 rounded-sm px-1 text-[11px] font-medium capitalize outline-none",
                "hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring/50 sm:inline-flex",
                PRIORITY_TONE[priority]
              )}
            />
          }
        >
          {priority}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-28">
          {PRIORITIES.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onChange({ priority: option })}
              className={cn("capitalize", option === priority && "font-medium")}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex w-12 shrink-0 items-center justify-end gap-0.5 text-xs text-muted-foreground">
        <EditableNumber
          value={story.storyPoints ?? 0}
          onCommit={(storyPoints) =>
            onChange({ storyPoints: Math.max(0, Math.round(storyPoints)) })
          }
          label="Story points"
          className="w-6 text-xs"
        />
        <span className="text-[11px] text-muted-foreground/60">pt</span>
      </div>

      <div className="w-20 shrink-0">
        <EditableLine
          value={story.assignee ?? ""}
          onCommit={(assignee) => onChange({ assignee })}
          label="Assignee"
          placeholder="Unassigned"
          className="text-xs text-muted-foreground"
        />
      </div>

      <RemoveButton onClick={onDelete} label="Delete story" />
    </div>
  );
}
