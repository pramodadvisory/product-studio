"use client"

import * as React from "react"
import { FilePlus, MoreHorizontal, SparklesIcon } from "lucide-react"

import { useDocs, type DocNode } from "@/hooks/use-docs"
import { FileTree } from "@/components/docs/file-tree"
import { DocEditor } from "@/components/docs/doc-editor"
import { DocsChat } from "@/components/docs/docs-chat"
import { useHeaderTitle, HeaderActions } from "@/components/header-title-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/**
 * Docs — specs, notes and the written detail.
 *
 * A workspace page: the file tree and the editor need the height, so the one
 * primary action (New doc) sits in the top bar. The AI assistant opens in a
 * side panel from ⋯ instead of taking a permanent third column.
 */
export default function DocsPage() {
  const {
    nodes,
    hydrated,
    createNode,
    renameNode,
    updateContent,
    deleteNode,
  } = useDocs()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [assistantOpen, setAssistantOpen] = React.useState(false)

  const selectedDoc = React.useMemo<DocNode | null>(
    () => nodes.find((n) => n.id === selectedId && n.type === "file") ?? null,
    [nodes, selectedId]
  )

  useHeaderTitle(selectedDoc ? `Docs › ${selectedDoc.name}` : "Docs")

  // Select the first available document once data has hydrated.
  React.useEffect(() => {
    if (!hydrated || selectedId) return
    const firstFile = nodes.find((n) => n.type === "file")
    if (firstFile) setSelectedId(firstFile.id)
  }, [hydrated, selectedId, nodes])

  // If the selected document is deleted, clear the selection.
  React.useEffect(() => {
    if (selectedId && !nodes.some((n) => n.id === selectedId)) {
      setSelectedId(null)
    }
  }, [nodes, selectedId])

  function handleCreateFromChat(name: string, content: string) {
    const node = createNode({ type: "file", name, parentId: null, content })
    setSelectedId(node.id)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <HeaderActions>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon-sm" aria-label="More actions" />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-52">
            <DropdownMenuItem onClick={() => setAssistantOpen(true)}>
              <SparklesIcon />
              Ask AI about this doc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Export</DropdownMenuItem>
            <DropdownMenuItem disabled>Share</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            const node = createNode({ type: "file", name: "Untitled.md", parentId: null, content: "" })
            setSelectedId(node.id)
          }}
        >
          <FilePlus className="h-4 w-4" />
          New doc
        </Button>
      </HeaderActions>

      {/* Left pane — file tree */}
      <aside className="hidden w-60 shrink-0 border-r md:block">
        <FileTree
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createNode}
          onRename={renameNode}
          onDelete={deleteNode}
        />
      </aside>

      {/* The document gets the rest of the width */}
      <main className="min-w-0 flex-1">
        <DocEditor
          doc={selectedDoc}
          onChange={(content) =>
            selectedDoc && updateContent(selectedDoc.id, content)
          }
          onRename={(name) => selectedDoc && renameNode(selectedDoc.id, name)}
        />
      </main>

      <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Ask AI</SheetTitle>
            <SheetDescription>
              {selectedDoc ? `Draft, summarise or rewrite ${selectedDoc.name}.` : "Draft a new doc."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <DocsChat
              doc={selectedDoc}
              onApplyContent={(content) =>
                selectedDoc && updateContent(selectedDoc.id, content)
              }
              onCreateDoc={(name, content) => {
                handleCreateFromChat(name, content)
                setAssistantOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
