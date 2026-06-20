"use client"

import * as React from "react"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Undo2Icon,
  Redo2Icon,
  FileTextIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import type { DocNode } from "@/hooks/use-docs"

type DocEditorProps = {
  doc: DocNode | null
  onChange: (content: string) => void
  onRename: (name: string) => void
}

type ToolButton = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  command: string
  value?: string
}

const TOOLS: (ToolButton | "separator")[] = [
  { icon: Undo2Icon, label: "Undo", command: "undo" },
  { icon: Redo2Icon, label: "Redo", command: "redo" },
  "separator",
  { icon: Heading1Icon, label: "Heading 1", command: "formatBlock", value: "H1" },
  { icon: Heading2Icon, label: "Heading 2", command: "formatBlock", value: "H2" },
  "separator",
  { icon: BoldIcon, label: "Bold", command: "bold" },
  { icon: ItalicIcon, label: "Italic", command: "italic" },
  { icon: UnderlineIcon, label: "Underline", command: "underline" },
  "separator",
  { icon: ListIcon, label: "Bullet list", command: "insertUnorderedList" },
  { icon: ListOrderedIcon, label: "Numbered list", command: "insertOrderedList" },
  { icon: QuoteIcon, label: "Quote", command: "formatBlock", value: "BLOCKQUOTE" },
]

export function DocEditor({ doc, onChange, onRename }: DocEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const lastDocId = React.useRef<string | null>(null)

  // Push content into the editable surface only when switching documents, or
  // when the content changed externally (e.g. the AI assistant rewrote it).
  // We avoid clobbering the DOM on every keystroke to keep the caret stable.
  React.useEffect(() => {
    const el = editorRef.current
    if (!el || !doc) return
    const switchedDoc = lastDocId.current !== doc.id
    if (switchedDoc || el.innerHTML !== (doc.content ?? "")) {
      el.innerHTML = doc.content ?? ""
    }
    lastDocId.current = doc.id
  }, [doc?.id, doc?.content])

  function exec(tool: ToolButton) {
    editorRef.current?.focus()
    document.execCommand(tool.command, false, tool.value)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <FileTextIcon className="size-8" />
        <p>Select or create a document to start editing.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Title */}
      <div className="border-b px-6 pt-4 pb-3">
        <Input
          value={doc.name}
          onChange={(e) => onRename(e.target.value)}
          className="h-auto border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
          aria-label="Document title"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5">
        {TOOLS.map((tool, i) =>
          tool === "separator" ? (
            <Separator
              key={`sep-${i}`}
              orientation="vertical"
              className="mx-1 h-5"
            />
          ) : (
            <Button
              key={tool.label}
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={tool.label}
              title={tool.label}
              // Use onMouseDown to keep the editor's selection from being lost.
              onMouseDown={(e) => {
                e.preventDefault()
                exec(tool)
              }}
            >
              <tool.icon className="size-4" />
            </Button>
          )
        )}
      </div>

      {/* Editable surface */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className={cn(
            "doc-prose mx-auto min-h-full max-w-3xl outline-none",
            "text-sm leading-relaxed text-foreground"
          )}
        />
      </div>
    </div>
  )
}
