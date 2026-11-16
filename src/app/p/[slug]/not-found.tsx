/** Shown for a link that is wrong, or whose project has been unpublished. */
export default function PublishedNotFound() {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col gap-2">
        <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Product Studio
        </p>
        <h1 className="text-xl font-semibold tracking-tight">This project isn&apos;t available</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The link may be mistyped, or the team may have unpublished it. Ask whoever shared it with you for a
          current link.
        </p>
      </div>
    </main>
  );
}
