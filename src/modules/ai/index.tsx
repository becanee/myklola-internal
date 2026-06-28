"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Message } from "./_logic"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/modules/shared"
import {
  IconSend,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react"

// Re-export from components
export { ChatSidebar } from "@/components/chat-sidebar"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WELCOME_SUGGESTIONS = [
  "Help me refactor a React component",
  "Explain database indexing strategies",
  "Write a unit test for this function",
  "Review my API design",
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let messageId = 0
function nextId(): string {
  return `msg_${++messageId}_${Date.now()}`
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
          <IconSparkles className="size-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
          <IconUser className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome Screen
// ---------------------------------------------------------------------------

function WelcomeScreen({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <IconSparkles className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          How can I help you today?
        </h2>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Ask me anything — I&apos;m here to help with code, design, and problem solving.
        </p>
      </div>

      <div className="grid gap-3 w-full max-w-lg">
        {WELCOME_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "w-full text-left rounded-xl border px-4 py-3 text-sm",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 transition-colors duration-150"
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatContent
// ---------------------------------------------------------------------------

export function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg: Message = {
      id: nextId(),
      role: "user",
      content: trimmed,
    }

    const aiMsg: Message = {
      id: nextId(),
      role: "assistant",
      content:
        "This is a placeholder response. The AI integration will be connected later.\n\nYou said: _" +
        trimmed +
        "_",
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput("")
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSuggestion(text: string) {
    const userMsg: Message = { id: nextId(), role: "user", content: text }
    const aiMsg: Message = {
      id: nextId(),
      role: "assistant",
      content:
        "This is a placeholder response. The AI integration will be connected later.\n\nYou asked: _" +
        text +
        "_",
    }
    setMessages((prev) => [...prev, userMsg, aiMsg])
  }

  const isWelcome = messages.length === 0

  return (
    <div className="flex flex-col flex-1">
      <PageHeader>
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <IconSparkles className="size-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium">AI Assistant</span>
      </PageHeader>

      <div ref={scrollRef} className="flex flex-col flex-1 overflow-y-auto">
        {isWelcome ? (
          <WelcomeScreen onSelect={handleSuggestion} />
        ) : (
          <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-muted/50 px-3 py-2",
            "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
            "transition-all duration-200"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className={cn(
              "flex-1 border-0 bg-transparent shadow-none resize-none",
              "placeholder:text-muted-foreground/60",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-0 max-h-44 py-1"
            )}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              "size-8 shrink-0 rounded-lg transition-all",
              input.trim()
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground/40"
            )}
          >
            <IconSend className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
