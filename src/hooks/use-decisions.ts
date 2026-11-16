"use client"

import * as React from "react"

import {
  SEED_DECISIONS,
} from "@/app/(main)/decisions/seed-data"
import {
  byDateDesc,
  toDecision,
  type Decision,
  type DecisionDraft,
} from "@/app/(main)/decisions/decisions"

import { isSampleProject } from "@/lib/projects"

/** The sample project keeps the original key so its saved log carries over. */
function storageKey(projectId: string) {
  return isSampleProject(projectId) ? "decisions" : `decisions:${projectId}`
}

function load(projectId: string): Decision[] {
  // Only the sample project comes with sample decisions; a new project starts empty.
  const seed = isSampleProject(projectId) ? SEED_DECISIONS : []
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    // Nothing stored yet means a first visit, not an emptied log — seed it.
    if (!raw) return seed
    return (JSON.parse(raw) as Decision[]).sort(byDateDesc)
  } catch {
    return seed
  }
}

/** The decision log for one project. `projectId` is null until the open project is known. */
export function useDecisions(projectId: string | null) {
  // The log starts over from storage whenever the project changes. Null means
  // the project isn't known yet (server render, hydration).
  const [log, setLog] = React.useState<{ projectId: string | null; decisions: Decision[] }>({
    projectId: null,
    decisions: [],
  })
  if (log.projectId !== projectId) {
    setLog({ projectId, decisions: projectId ? load(projectId) : [] })
  }
  const decisions = log.decisions
  const hydrated = projectId !== null && log.projectId === projectId

  const setDecisions = React.useCallback(
    (action: React.SetStateAction<Decision[]>) =>
      setLog((prev) => ({
        ...prev,
        decisions: typeof action === "function" ? action(prev.decisions) : action,
      })),
    []
  )

  React.useEffect(() => {
    if (!hydrated || !projectId) return
    try {
      window.localStorage.setItem(storageKey(projectId), JSON.stringify(decisions))
    } catch {
      // ignore write failures (e.g. private mode)
    }
  }, [decisions, hydrated, projectId])

  /** Accepts a drafted record onto the timeline. */
  const saveDecision = React.useCallback((draft: DecisionDraft) => {
    const decision = toDecision(draft)
    setDecisions((prev) => [decision, ...prev].sort(byDateDesc))
    return decision
  }, [setDecisions])

  const updateDecision = React.useCallback(
    (id: string, patch: Partial<DecisionDraft>) => {
      setDecisions((prev) =>
        prev
          .map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
          )
          .sort(byDateDesc)
      )
    },
    [setDecisions]
  )

  const deleteDecision = React.useCallback((id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }, [setDecisions])

  return {
    decisions,
    hydrated,
    saveDecision,
    updateDecision,
    deleteDecision,
  }
}
