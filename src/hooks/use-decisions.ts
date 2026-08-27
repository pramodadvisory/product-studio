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

const STORAGE_KEY = "decisions"

function load(): Decision[] {
  if (typeof window === "undefined") return SEED_DECISIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    // Nothing stored yet means a first visit, not an emptied log — seed it.
    if (!raw) return SEED_DECISIONS
    return (JSON.parse(raw) as Decision[]).sort(byDateDesc)
  } catch {
    return SEED_DECISIONS
  }
}

export function useDecisions() {
  const [decisions, setDecisions] = React.useState<Decision[]>(SEED_DECISIONS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setDecisions(load())
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions))
    } catch {
      // ignore write failures (e.g. private mode)
    }
  }, [decisions, hydrated])

  /** Accepts a drafted record onto the timeline. */
  const saveDecision = React.useCallback((draft: DecisionDraft) => {
    const decision = toDecision(draft)
    setDecisions((prev) => [decision, ...prev].sort(byDateDesc))
    return decision
  }, [])

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
    []
  )

  const deleteDecision = React.useCallback((id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return {
    decisions,
    hydrated,
    saveDecision,
    updateDecision,
    deleteDecision,
  }
}
