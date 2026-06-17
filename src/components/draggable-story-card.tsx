"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StoryCard, type StoryCardProps } from "./story-card";

export function DraggableStoryCard({
  story,
  phaseId,
  sprintId,
}: {
  story: StoryCardProps;
  phaseId: string;
  sprintId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id || "",
    data: {
      type: "story",
      sprintId,
      phaseId,
      story,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <StoryCard {...story} />
    </div>
  );
}
