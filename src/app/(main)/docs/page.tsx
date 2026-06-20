"use client"

import * as React from "react"
import { Download, Share2, FilePlus } from "lucide-react"

import { useDocs, type DocNode } from "@/hooks/use-docs"
import { FileTree } from "@/components/docs/file-tree"
import { DocEditor } from "@/components/docs/doc-editor"
import { DocsChat } from "@/components/docs/docs-chat"
import { useHeaderTitle, HeaderActions } from "@/components/header-title-context"
import { Button } from "@/components/ui/button"

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

  const selectedDoc = React.useMemo<DocNode | null>(
    () => nodes.find((n) => n.id === selectedId && n.type === "file") ?? null,
    [nodes, selectedId]
  )

  useHeaderTitle(selectedDoc?.name ?? "Docs")

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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            const node = createNode({ type: "file", name: "Untitled.md", parentId: null, content: "" })
            setSelectedId(node.id)
          }}
        >
          <FilePlus className="h-4 w-4" />
          New Doc
        </Button>
        {selectedDoc && (
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </>
        )}
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

      {/* Center pane — document editor */}
      <main className="min-w-0 flex-1">
        <DocEditor
          doc={selectedDoc}
          onChange={(content) =>
            selectedDoc && updateContent(selectedDoc.id, content)
          }
          onRename={(name) => selectedDoc && renameNode(selectedDoc.id, name)}
        />
      </main>

      {/* Right pane — AI chat */}
      <aside className="hidden w-80 shrink-0 border-l lg:block">
        <DocsChat
          doc={selectedDoc}
          onApplyContent={(content) =>
            selectedDoc && updateContent(selectedDoc.id, content)
          }
          onCreateDoc={handleCreateFromChat}
        />
      </aside>
    </div>
  )
}
