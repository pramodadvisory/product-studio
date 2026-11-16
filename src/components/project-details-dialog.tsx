"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Edit the project's name and its one-line description — the two things the
 * projects page shows for it. The same questions as the New project dialog.
 */
export function ProjectDetailsDialog({
  open,
  onOpenChange,
  name,
  description,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description?: string;
  onSave: (details: { name: string; description?: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remounted on every open, so it always starts from the saved values. */}
        {open && (
          <DetailsForm
            name={name}
            description={description ?? ""}
            onCancel={() => onOpenChange(false)}
            onSave={(details) => {
              onSave(details);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailsForm({
  name: savedName,
  description: savedDescription,
  onCancel,
  onSave,
}: {
  name: string;
  description: string;
  onCancel: () => void;
  onSave: (details: { name: string; description?: string }) => void;
}) {
  const [name, setName] = React.useState(savedName);
  const [description, setDescription] = React.useState(savedDescription);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Project details</DialogTitle>
        <DialogDescription>Shown for this project on the projects page.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-project-name">Project name</Label>
        <Input id="edit-project-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-project-description">What are you making, in one line?</Label>
        <Input
          id="edit-project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="For example: a booking app for small physio clinics"
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
