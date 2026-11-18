"use client";

import * as React from "react";
import { toast } from "sonner";
import { UsersIcon, XIcon } from "lucide-react";

import { useProjectBoard } from "@/components/project-data";
import { ProjectExitDialog } from "@/components/project-exit-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { initialsOf, useCurrentUser } from "@/lib/auth/use-current-user";
import {
  addCollaborator,
  listCollaborators,
  removeCollaborator,
  updateCollaborator,
  type Collaborator,
  type CollaboratorRole,
} from "@/lib/collaborators";
import { isLocalOnly, isSupabaseConfigured } from "@/lib/product-board/storage";

const ROLE_ITEMS = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_HELP: Record<CollaboratorRole, string> = {
  editor: "Can change content and publish.",
  viewer: "Can read, but not change anything.",
};

/**
 * Who's on the project. Everyone on it can see the list; the owner adds
 * people, changes their role and organisation, and removes them. Anyone else
 * can leave. Hidden for the sample project and when sign-in is off.
 */
export function ShareButton() {
  const { board } = useProjectBoard();
  const [open, setOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  if (!board || !isSupabaseConfigured() || isLocalOnly(board.id)) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setOpen(true)}>
        <UsersIcon />
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {/* Remounted on every open, so the list is always fresh. */}
          {open && (
            <SharePanel
              boardId={board.id}
              projectName={board.productName}
              onClose={() => setOpen(false)}
              onLeave={() => {
                setOpen(false);
                setLeaving(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <ProjectExitDialog
        exit={leaving ? "leave" : null}
        onOpenChange={(next) => !next && setLeaving(false)}
        projectId={board.id}
        projectName={board.productName}
      />
    </>
  );
}

function SharePanel({
  boardId,
  projectName,
  onClose,
  onLeave,
}: {
  boardId: string;
  projectName: string;
  onClose: () => void;
  /** Asks to confirm leaving; see ProjectExitDialog. */
  onLeave: () => void;
}) {
  const { user } = useCurrentUser();
  const [people, setPeople] = React.useState<Collaborator[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const next = await listCollaborators(boardId);
      setPeople(next);
      setLoadError(null);
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }, [boardId]);

  React.useEffect(() => {
    let cancelled = false;
    listCollaborators(boardId).then(
      (next) => !cancelled && setPeople(next),
      (error: Error) => !cancelled && setLoadError(error.message)
    );
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const me = people?.find((person) => person.userId === user?.id);
  const isOwner = me?.role === "owner";
  // Organisations already on this project, offered as suggestions.
  const organisations = [...new Set((people ?? []).map((p) => p.organisation).filter((o): o is string => Boolean(o)))];

  const run = async (action: () => Promise<void>, done?: string) => {
    try {
      await action();
      if (done) toast.success(done);
    } catch (error) {
      toast.error((error as Error).message);
    }
    await reload();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>People on {projectName}</DialogTitle>
        <DialogDescription>
          {isOwner
            ? "Add people who have signed up to Product Studio. Tag each with their organisation so everyone can see who's who."
            : "Only the owner can add or remove people."}
        </DialogDescription>
      </DialogHeader>

      {isOwner && <AddPersonForm organisations={organisations} onAdd={(input) => run(() => addCollaborator(boardId, input), `Added ${input.email.trim()}`)} />}

      <datalist id="share-organisations">
        {organisations.map((organisation) => (
          <option key={organisation} value={organisation} />
        ))}
      </datalist>

      {loadError ? (
        <FieldError>Couldn&apos;t load the people on this project: {loadError}</FieldError>
      ) : !people ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="-mx-1 flex max-h-80 flex-col gap-1 overflow-y-auto px-1">
          {people.map((person) => (
            <PersonRow
              key={person.userId}
              person={person}
              isYou={person.userId === user?.id}
              canManage={isOwner}
              onChange={(changes) => run(() => updateCollaborator(boardId, person.userId, changes))}
              onRemove={() => run(() => removeCollaborator(boardId, person.userId), `Removed ${person.name ?? person.email}`)}
            />
          ))}
        </ul>
      )}

      <DialogFooter>
        {me && !isOwner && (
          <Button variant="ghost" className="mr-auto text-destructive" onClick={onLeave}>
            Leave project
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </>
  );
}

function AddPersonForm({
  organisations,
  onAdd,
}: {
  organisations: string[];
  onAdd: (input: { email: string; role: CollaboratorRole; organisation: string }) => Promise<void>;
}) {
  const [email, setEmail] = React.useState("");
  const [organisation, setOrganisation] = React.useState("");
  const [role, setRole] = React.useState<CollaboratorRole>("editor");
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    await onAdd({ email, role, organisation });
    setBusy(false);
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border p-3">
      <Field>
        <FieldLabel htmlFor="share-email">Email</FieldLabel>
        <Input
          id="share-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="The email they signed up with"
          required
          autoFocus
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field>
          <FieldLabel htmlFor="share-organisation">Organisation</FieldLabel>
          <Input
            id="share-organisation"
            list="share-organisations"
            value={organisation}
            onChange={(event) => setOrganisation(event.target.value)}
            placeholder={organisations[0] ? `For example: ${organisations[0]}` : "For example: the client's name"}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="share-role">Role</FieldLabel>
          <Select items={ROLE_ITEMS} value={role} onValueChange={(value) => value && setRole(value as CollaboratorRole)}>
            <SelectTrigger id="share-role" className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{ROLE_HELP[role]}</p>
        <Button type="submit" size="sm" disabled={!email.trim() || busy}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}

function PersonRow({
  person,
  isYou,
  canManage,
  onChange,
  onRemove,
}: {
  person: Collaborator;
  isYou: boolean;
  canManage: boolean;
  onChange: (changes: { role?: CollaboratorRole; organisation?: string | null }) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [organisation, setOrganisation] = React.useState(person.organisation ?? "");
  const display = person.name || person.email;
  const isOwnerRow = person.role === "owner";

  const saveOrganisation = () => {
    const next = organisation.trim();
    if (next !== (person.organisation ?? "")) void onChange({ organisation: next || null });
  };

  return (
    <li className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg text-xs">{initialsOf(display)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {display}
          {isYou && <span className="font-normal text-muted-foreground"> (you)</span>}
        </span>
        {canManage ? (
          <input
            aria-label={`${display}'s organisation`}
            list="share-organisations"
            value={organisation}
            onChange={(event) => setOrganisation(event.target.value)}
            onBlur={saveOrganisation}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            placeholder="Add organisation"
            className="-mx-1 truncate rounded bg-transparent px-1 text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60 hover:bg-muted focus:bg-muted focus:text-foreground"
          />
        ) : (
          <span className="truncate text-xs text-muted-foreground">
            {[person.organisation, person.name ? person.email : null].filter(Boolean).join(" · ") || person.email}
          </span>
        )}
      </div>
      {isOwnerRow || !canManage ? (
        <span className="shrink-0 text-xs text-muted-foreground">{isOwnerRow ? "Owner" : person.role === "editor" ? "Editor" : "Viewer"}</span>
      ) : (
        <>
          <Select
            items={ROLE_ITEMS}
            value={person.role}
            onValueChange={(value) => value && value !== person.role && void onChange({ role: value as CollaboratorRole })}
          >
            <SelectTrigger size="sm" className="w-24 shrink-0" aria-label={`${display}'s role`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${display}`} onClick={() => void onRemove()}>
            <XIcon />
          </Button>
        </>
      )}
    </li>
  );
}
