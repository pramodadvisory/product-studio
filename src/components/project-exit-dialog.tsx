"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { listCollaborators } from "@/lib/collaborators";
import { isSupabaseConfigured } from "@/lib/product-board/storage";
import { deleteProject, leaveProject } from "@/lib/projects";

export type ProjectExit = "delete" | "leave";

/**
 * Confirms deleting a project (its owner) or leaving it (anyone else), then
 * goes to the projects page. Deleting is for everyone on the project and
 * can't be undone, so the owner types the project's name first.
 */
export function ProjectExitDialog({
  exit,
  onOpenChange,
  projectId,
  projectName,
}: {
  /** Which confirmation to show; null when closed. */
  exit: ProjectExit | null;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}) {
  return (
    <Dialog open={exit !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remounted on every open, so it never starts half-typed. */}
        {exit === "delete" && (
          <DeleteForm projectId={projectId} projectName={projectName} onClose={() => onOpenChange(false)} />
        )}
        {exit === "leave" && (
          <LeaveForm projectId={projectId} projectName={projectName} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** How many other people are on the project, or null while unknown. */
function useOthersCount(projectId: string, me: string | undefined): number | null {
  const [count, setCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    listCollaborators(projectId).then(
      (people) => !cancelled && setCount(people.filter((person) => person.userId !== me).length),
      // Only used for a sentence; without it the dialog still says enough.
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [projectId, me]);
  return count;
}

function DeleteForm({ projectId, projectName, onClose }: { projectId: string; projectName: string; onClose: () => void }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const others = useOthersCount(projectId, user?.id);
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirmed = typed.trim() === projectName.trim();
  const shared = isSupabaseConfigured();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProject(projectId);
      onClose();
      toast.success(`Deleted ${projectName}`);
      router.push("/projects");
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Delete {projectName}?</DialogTitle>
        <DialogDescription>
          {shared
            ? "This deletes the project for everyone on it: its stages, decisions, experiments, story map and sprints. Its published link stops working. This can't be undone."
            : "This deletes the project from this browser: its stages, decisions, experiments, story map and sprints. This can't be undone."}
        </DialogDescription>
      </DialogHeader>
      {others !== null && others > 0 && (
        <p className="text-sm">
          {others === 1 ? "1 other person loses access." : `${others} other people lose access.`}
        </p>
      )}
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="delete-project-name">Type the project name to confirm</FieldLabel>
        <Input
          id="delete-project-name"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={projectName}
          autoComplete="off"
          autoFocus
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!confirmed || busy}>
          {busy ? "Deleting…" : "Delete project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function LeaveForm({ projectId, projectName, onClose }: { projectId: string; projectName: string; onClose: () => void }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      await leaveProject(projectId, user.id);
      onClose();
      toast.success(`You left ${projectName}`);
      router.push("/projects");
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Leave {projectName}?</DialogTitle>
        <DialogDescription>
          It disappears from your projects and you can no longer open it. The project and everyone else on it
          are unaffected. Only the owner can add you back.
        </DialogDescription>
      </DialogHeader>
      {error && <FieldError>{error}</FieldError>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!user || busy} autoFocus>
          {busy ? "Leaving…" : "Leave project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
