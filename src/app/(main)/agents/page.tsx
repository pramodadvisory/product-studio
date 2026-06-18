"use client"

import * as React from "react"
import { BotIcon, MessageSquareIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { AgentChatSheet } from "@/components/agents/agent-chat-sheet"
import { useAgents, type Agent } from "@/hooks/use-agents"

export default function AgentsPage() {
  const { agents, createAgent, deleteAgent, hydrated } = useAgents()
  const [activeAgent, setActiveAgent] = React.useState<Agent | null>(null)
  const [chatOpen, setChatOpen] = React.useState(false)

  function openChat(agent: Agent) {
    setActiveAgent(agent)
    setChatOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-4 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Agents
          </h1>
          <p className="text-sm text-muted-foreground">
            Build assistants that take repetitive work off your plate.
          </p>
        </div>
        <CreateAgentDialog onCreate={createAgent} />
      </div>

      {hydrated && agents.length === 0 ? (
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotIcon />
            </EmptyMedia>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>
              Create your first agent to start automating your work.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateAgentDialog onCreate={createAgent} />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <BotIcon className="size-4" />
                </div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {agent.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openChat(agent)}
                >
                  <MessageSquareIcon />
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${agent.name}`}
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2Icon />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AgentChatSheet
        agent={activeAgent}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  )
}
