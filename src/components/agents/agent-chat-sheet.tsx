"use client"

import * as React from "react"
import { SendIcon, BotIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Agent } from "@/hooks/use-agents"

type Message = {
  id: string
  role: "user" | "agent"
  content: string
}

type AgentChatSheetProps = {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// UI-only mock: simulate an agent reply. Replace with a real API call later.
function mockReply(agent: Agent, prompt: string): string {
  return `(Demo response — no LLM connected yet)\n\nAs "${agent.name}", I'd handle that request using my instructions. You asked: "${prompt}". Wire this agent up to the Claude API to get real answers.`
}

export function AgentChatSheet({
  agent,
  open,
  onOpenChange,
}: AgentChatSheetProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [thinking, setThinking] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Reset the conversation whenever a different agent is opened.
  React.useEffect(() => {
    setMessages([])
    setInput("")
    setThinking(false)
  }, [agent?.id])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, thinking])

  function send() {
    const text = input.trim()
    if (!text || !agent || thinking) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setThinking(true)

    // Simulated latency for the mock reply.
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: mockReply(agent, text),
        },
      ])
      setThinking(false)
    }, 700)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="flex flex-row items-center gap-3 border-b">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <BotIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate">
              {agent?.name ?? "Agent"}
            </SheetTitle>
            <SheetDescription className="truncate">
              {agent?.description || "Chat with your agent"}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && !thinking ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <BotIcon className="size-8" />
              <p>Send a message to start working with this agent.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your agent…"
              className="max-h-32 min-h-10 flex-1 resize-none"
              rows={1}
            />
            <Button
              size="icon"
              onClick={send}
              disabled={!input.trim() || thinking}
              aria-label="Send message"
            >
              <SendIcon />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
