"use client"

import * as React from "react"
import { BotIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { AgentChatSheet } from "@/components/agents/agent-chat-sheet"
import { useAgents, type Agent } from "@/hooks/use-agents"
import { useHeaderTitle } from "@/components/header-title-context"
import { PageColumn, PageHeader, SectionLabel } from "@/components/page-header"

/**
 * Agents — assistants that take repeat work off your plate.
 *
 * One action (create an agent). Each row opens a chat with that agent in a
 * side panel; delete sits at the end of the row, out of the way.
 */
export default function AgentsPage() {
  const { agents, createAgent, deleteAgent, hydrated } = useAgents()
  const [activeAgent, setActiveAgent] = React.useState<Agent | null>(null)
  const [chatOpen, setChatOpen] = React.useState(false)

  useHeaderTitle("Agents")

  function openChat(agent: Agent) {
    setActiveAgent(agent)
    setChatOpen(true)
  }

  return (
    <PageColumn>
      <PageHeader
        eyebrow="Library"
        title="Agents"
        description="Assistants that take repeat work off your plate."
        action={<CreateAgentDialog onCreate={createAgent} />}
      />

      {hydrated && agents.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotIcon />
            </EmptyMedia>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>
              Create one to summarise meetings, draft emails or chase updates.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section>
          <SectionLabel>Your agents</SectionLabel>
          <ul className="flex flex-col divide-y border-y">
            {agents.map((agent) => (
              <li key={agent.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openChat(agent)}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-1.5 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <BotIcon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <span className="line-clamp-1 text-[13px] text-muted-foreground">
                      {agent.description || "No description"}
                    </span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${agent.name}`}
                  onClick={() => deleteAgent(agent.id)}
                  className="text-muted-foreground opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AgentChatSheet agent={activeAgent} open={chatOpen} onOpenChange={setChatOpen} />
    </PageColumn>
  )
}
