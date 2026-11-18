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
import { useProjectDoc } from "@/lib/project-work/use-project-doc"

const NO_DECISIONS: Decision[] = []

/** Only the sample project comes with sample decisions; a new project starts empty. */
function seedDecisions(projectId: string): Decision[] {
  return isSampleProject(projectId) ? SEED_DECISIONS : NO_DECISIONS
}

/** Where earlier versions kept the log in this browser, so it carries over. */
function legacyKey(projectId: string) {
  return isSampleProject(projectId) ? "decisions" : `decisions:${projectId}`
}

/**
 * The decision log for one project, saved to Supabase (and this browser).
 * `projectId` is null until the open project is known.
 */
export function useDecisions(projectId: string | null) {
  const { value: decisions, setValue: setDecisions, hydrated } = useProjectDoc<Decision[]>({
    projectId,
    kind: "decisions",
    seed: seedDecisions,
    empty: NO_DECISIONS,
    legacyLocalKey: legacyKey,
  })

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
