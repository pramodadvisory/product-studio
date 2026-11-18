"use client";

import * as React from "react";
import { CopyIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react";
import { toast } from "sonner";

import { useProjectBoard } from "@/components/project-data";
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
import { Textarea } from "@/components/ui/textarea";
import { isSampleProject } from "@/lib/projects";
import { SAMPLE_SLUG } from "@/lib/publishing/sample";
import { usePublication, type PublicationController } from "@/lib/publishing/use-publication";
import { publishedPath } from "@/lib/publishing/types";
import { cn } from "@/lib/utils";

/**
 * Publish: a read-only copy of the project that anyone with the link can
 * read. The PM keeps editing the draft; readers see the copy until the next
 * publish. The button says which of three states the project is in.
 */
export function PublishButton() {
  const { board, role, flush } = useProjectBoard();
  const publication = usePublication(board);
  const [open, setOpen] = React.useState(false);

  // Viewers can't publish; the database refuses it too.
  if (!board || role === "viewer") return null;

  const live = Boolean(publication.status?.liveVersion);
  const label = !live ? "Publish" : publication.hasChanges ? "Publish changes" : "Published";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => {
          flush();
          setOpen(true);
        }}
      >
        {live ? (
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", publication.hasChanges ? "bg-amber-500" : "bg-emerald-500")}
          />
        ) : (
          <GlobeIcon />
        )}
        <span className={cn(!live && "hidden sm:inline")}>{label}</span>
      </Button>
      <PublishDialog
        open={open}
        onOpenChange={setOpen}
        publication={publication}
        isSample={isSampleProject(board.id)}
      />
    </>
  );
}

function linkFor(slug: string) {
  return `${window.location.origin}${publishedPath(slug)}`;
}

async function copyLink(slug: string) {
  try {
    await navigator.clipboard.writeText(linkFor(slug));
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link. Select it and copy it instead.");
  }
}

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PublishDialog({
  open,
  onOpenChange,
  publication,
  isSample,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: PublicationController;
  isSample: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Remounted on every open, so the note starts empty. */}
        {open && <PublishPanel publication={publication} isSample={isSample} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PublishPanel({
  publication,
  isSample,
  onClose,
}: {
  publication: PublicationController;
  isSample: boolean;
  onClose: () => void;
}) {
  const { status, available, hasChanges, error } = publication;
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<"publish" | "unpublish" | null>(null);

  if (!available && isSample) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>The sample&apos;s demo link</DialogTitle>
          <DialogDescription>
            Publishing needs Supabase, which isn&apos;t set up here. The sample project has a fixed demo link that
            works anyway. It shows the sample as it ships, not edits made in this browser.
          </DialogDescription>
        </DialogHeader>
        <LinkField slug={SAMPLE_SLUG} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (!available) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Publishing needs Supabase</DialogTitle>
          <DialogDescription>
            This project is saved only in this browser, so there&apos;s nowhere for readers to open it. Add
            NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then run the migrations in
            supabase/migrations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </>
    );
  }

  const live = status?.liveVersion ?? null;
  const nextVersion = (status?.latestVersion ?? 0) + 1;
  const upToDate = Boolean(live) && !hasChanges;

  const publish = async () => {
    setBusy("publish");
    try {
      const result = await publication.publish(note);
      setNote("");
      toast.success(`Published v${result.version}`, {
        description: "Anyone with the link can now read it.",
        action: { label: "Copy link", onClick: () => void copyLink(result.slug) },
      });
    } catch (err) {
      toast.error("Couldn't publish", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    setBusy("unpublish");
    try {
      await publication.unpublish();
      toast.success("Unpublished", {
        description: "The link now says the project isn't available. Publish again to bring it back at the same link.",
      });
    } catch (err) {
      toast.error("Couldn't unpublish", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!upToDate && !busy) void publish();
      }}
    >
      <DialogHeader>
        <DialogTitle>{live ? `Published · v${live}` : "Publish this project"}</DialogTitle>
        <DialogDescription>
          {live
            ? `Anyone with the link can read v${live}, published ${when(status?.publishedAt ?? null)}. ${
                hasChanges ? "You've made changes since then." : "It matches your latest edits."
              }`
            : "Anyone with the link can read a copy of this project as it is now. They can't edit it, and your later edits stay private until you publish again."}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Couldn&apos;t check publishing: {error}. If this mentions a missing function, run
          supabase/migrations/0002_publishing.sql in Supabase.
        </p>
      )}

      {live && status?.slug && <LinkField slug={status.slug} />}

      {!upToDate && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="publish-note">
            {status?.latestVersion ? "What changed? (optional)" : "Note for readers (optional)"}
          </Label>
          <Textarea
            id="publish-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: Revised pricing after six client interviews"
            rows={2}
            autoFocus
          />
          <p className="text-[13px] text-muted-foreground">
            Shown at the top of the published page
            {status?.latestVersion ? ", above a list of what changed since the last version." : "."}
          </p>
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Readers see the Discover and Define answers, the delivery plan and the launch checklist. Unanswered
        questions are left out. Experiments, the story map, metrics, decisions and docs aren&apos;t included yet.
      </p>

      <DialogFooter className="sm:justify-between">
        {live ? (
          <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => void unpublish()}>
            {busy === "unpublish" ? "Unpublishing…" : "Unpublish"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            {upToDate ? "Done" : "Cancel"}
          </Button>
          {!upToDate && (
            <Button type="submit" disabled={busy !== null || status === null}>
              {busy === "publish" ? "Publishing…" : live ? `Publish v${nextVersion}` : status?.latestVersion ? "Publish again" : "Publish"}
            </Button>
          )}
        </div>
      </DialogFooter>
    </form>
  );
}

/** The published link, with copy and open buttons. */
function LinkField({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="published-link">Link</Label>
      <div className="flex gap-2">
        <Input
          id="published-link"
          readOnly
          value={linkFor(slug)}
          onFocus={(e) => e.currentTarget.select()}
          className="font-mono text-xs"
        />
        <Button type="button" variant="outline" size="icon" aria-label="Copy link" onClick={() => void copyLink(slug)}>
          <CopyIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open the published project"
          nativeButton={false}
          render={<a href={publishedPath(slug)} target="_blank" rel="noreferrer" />}
        >
          <ExternalLinkIcon />
        </Button>
      </div>
    </div>
  );
}
