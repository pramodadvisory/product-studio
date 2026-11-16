"use client"

import * as React from "react"

export type DocNode = {
  id: string
  /** "folder" holds children; "file" holds editable HTML content. */
  type: "folder" | "file"
  name: string
  /** Parent folder id, or null for root-level nodes. */
  parentId: string | null
  /** HTML content (files only). */
  content?: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = "docs-tree"

const now = Date.now()

const SEED_NODES: DocNode[] = [
  {
    id: "folder-product",
    type: "folder",
    name: "Product",
    parentId: null,
    createdAt: now - 1000 * 60 * 60 * 24 * 5,
    updatedAt: now - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "file-prd",
    type: "file",
    name: "PRD.md",
    parentId: "folder-product",
    content:
      "<h1>Product Requirements</h1><p>Start writing your product requirements here, or ask the AI assistant on the right to draft them for you.</p><ul><li>Problem statement</li><li>Target users</li><li>Key features</li></ul>",
    createdAt: now - 1000 * 60 * 60 * 24 * 4,
    updatedAt: now - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "file-roadmap",
    type: "file",
    name: "Roadmap.md",
    parentId: "folder-product",
    content:
      "<h1>Roadmap</h1><p>Outline the milestones for the next few quarters.</p>",
    createdAt: now - 1000 * 60 * 60 * 24 * 3,
    updatedAt: now - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "file-notes",
    type: "file",
    name: "Notes.md",
    parentId: null,
    content: "<h1>Notes</h1><p>A scratchpad for loose ideas.</p>",
    createdAt: now - 1000 * 60 * 60 * 24,
    updatedAt: now - 1000 * 60 * 60 * 24,
  },
]

function load(): DocNode[] {
  if (typeof window === "undefined") return SEED_NODES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_NODES
    return JSON.parse(raw) as DocNode[]
  } catch {
    return SEED_NODES
  }
}

export function useDocs() {
  const [nodes, setNodes] = React.useState<DocNode[]>(SEED_NODES)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setNodes(load())
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
    } catch {
      // ignore write failures (e.g. private mode)
    }
  }, [nodes, hydrated])

  const createNode = React.useCallback(
    (input: {
      type: DocNode["type"]
      name: string
      parentId: string | null
      content?: string
    }) => {
      const ts = Date.now()
      const node: DocNode = {
        id: crypto.randomUUID(),
        type: input.type,
        name: input.name,
        parentId: input.parentId,
        content: input.type === "file" ? input.content ?? "" : undefined,
        createdAt: ts,
        updatedAt: ts,
      }
      setNodes((prev) => [...prev, node])
      return node
    },
    []
  )

  const renameNode = React.useCallback((id: string, name: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, name, updatedAt: Date.now() } : n
      )
    )
  }, [])

  const updateContent = React.useCallback((id: string, content: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n
      )
    )
  }, [])

  /** Deletes a node and, for folders, all of its descendants. */
  const deleteNode = React.useCallback((id: string) => {
    setNodes((prev) => {
      const toDelete = new Set<string>([id])
      let changed = true
      while (changed) {
        changed = false
        for (const n of prev) {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id)
            changed = true
          }
        }
      }
      return prev.filter((n) => !toDelete.has(n.id))
    })
  }, [])

  return {
    nodes,
    hydrated,
    createNode,
    renameNode,
    updateContent,
    deleteNode,
  }
}
