"use client"

import * as React from "react"
import {
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FilePlusIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocNode } from "@/hooks/use-docs"

type FileTreeProps = {
  nodes: DocNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: (input: {
    type: DocNode["type"]
    name: string
    parentId: string | null
  }) => DocNode
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function FileTree({
  nodes,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: FileTreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(nodes.filter((n) => n.type === "folder").map((n) => n.id))
  )
  const [renamingId, setRenamingId] = React.useState<string | null>(null)

  const childrenOf = React.useCallback(
    (parentId: string | null) =>
      nodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => {
          // Folders first, then alphabetical.
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1
          return a.name.localeCompare(b.name)
        }),
    [nodes]
  )

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCreate(type: DocNode["type"], parentId: string | null) {
    const name =
      type === "folder" ? "New folder" : `Untitled-${Date.now() % 1000}.md`
    const node = onCreate({ type, name, parentId })
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId))
    if (type === "file") onSelect(node.id)
    setRenamingId(node.id)
  }

  function renderNode(node: DocNode, depth: number): React.ReactNode {
    const isFolder = node.type === "folder"
    const isOpen = expanded.has(node.id)
    const isSelected = node.id === selectedId
    const isRenaming = node.id === renamingId

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md pr-1 text-sm",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => {
              if (isFolder) toggle(node.id)
              else onSelect(node.id)
            }}
          >
            {isFolder ? (
              <>
                <ChevronRightIcon
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
                {isOpen ? (
                  <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
              </>
            ) : (
              <>
                <span className="size-3.5 shrink-0" />
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              </>
            )}

            {isRenaming ? (
              <Input
                autoFocus
                defaultValue={node.name}
                className="h-6 px-1 py-0 text-sm"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v) onRename(node.id, v)
                  setRenamingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).blur()
                  } else if (e.key === "Escape") {
                    setRenamingId(null)
                  }
                }}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
                  aria-label={`Actions for ${node.name}`}
                />
              }
            >
              <MoreVerticalIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isFolder && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleCreate("file", node.id)}
                  >
                    <FilePlusIcon className="size-4" />
                    New document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCreate("folder", node.id)}
                  >
                    <FolderPlusIcon className="size-4" />
                    New folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setRenamingId(node.id)}>
                <PencilIcon className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(node.id)}
              >
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isFolder && isOpen && (
          <div>{childrenOf(node.id).map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    )
  }

  const roots = childrenOf(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Files
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="New document"
            onClick={() => handleCreate("file", null)}
          >
            <FilePlusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="New folder"
            onClick={() => handleCreate("folder", null)}
          >
            <FolderPlusIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {roots.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No documents yet. Create one to get started.
          </p>
        ) : (
          roots.map((n) => renderNode(n, 0))
        )}
      </div>
    </div>
  )
}
