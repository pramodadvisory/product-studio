"use client"

import * as React from "react"

export type Agent = {
  id: string
  name: string
  description: string
  instructions: string
  createdAt: number
}

const STORAGE_KEY = "agents"

const SEED_AGENTS: Agent[] = [
  {
    id: "seed-1",
    name: "Meeting Summarizer",
    description: "Turns raw meeting notes into concise action items.",
    instructions:
      "You are an assistant that reads meeting notes and produces a short summary followed by a bulleted list of clear action items, each with an owner if mentioned.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "seed-2",
    name: "Email Drafter",
    description: "Drafts professional emails from a few bullet points.",
    instructions:
      "You are a writing assistant. Given a few bullet points, draft a clear, professional, and friendly email. Keep it concise.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
]

function load(): Agent[] {
  if (typeof window === "undefined") return SEED_AGENTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_AGENTS
    return JSON.parse(raw) as Agent[]
  } catch {
    return SEED_AGENTS
  }
}

export function useAgents() {
  const [agents, setAgents] = React.useState<Agent[]>(SEED_AGENTS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setAgents(load())
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
    } catch {
      // ignore write failures (e.g. private mode)
    }
  }, [agents, hydrated])

  const createAgent = React.useCallback(
    (input: Omit<Agent, "id" | "createdAt">) => {
      const agent: Agent = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }
      setAgents((prev) => [agent, ...prev])
      return agent
    },
    []
  )

  const deleteAgent = React.useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { agents, createAgent, deleteAgent, hydrated }
}
