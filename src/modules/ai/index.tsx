"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Message } from "./_logic"
import { nextId, makeTitle } from "./_logic"
import { useChatStream, type StreamStatus } from "./_logic"
import type { Conversation } from "./_logic"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/modules/shared"
import {
  IconSend,
  IconSparkles,
  IconUser,
  IconCopy,
  IconCheck,
  IconPlayerStop,
  IconBrain,
  IconChevronDown,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useModels } from "@/modules/client/models/_logic"
import type { Model } from "@/modules/client/models/_logic"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Re-export from components
export { ChatSidebar } from "@/components/chat-sidebar"

// ---------------------------------------------------------------------------
// Markdown / Syntax Highlighting imports
// ---------------------------------------------------------------------------

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

// Register commonly used languages
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript"
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript"
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx"
import python from "react-syntax-highlighter/dist/esm/languages/prism/python"
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import css from "react-syntax-highlighter/dist/esm/languages/prism/css"
import html from "react-syntax-highlighter/dist/esm/languages/prism/markup"
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import markdownLang from "react-syntax-highlighter/dist/esm/languages/prism/markdown"

SyntaxHighlighter.registerLanguage("javascript", js)
SyntaxHighlighter.registerLanguage("typescript", ts)
SyntaxHighlighter.registerLanguage("tsx", tsx)
SyntaxHighlighter.registerLanguage("jsx", jsx)
SyntaxHighlighter.registerLanguage("python", python)
SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("json", json)
SyntaxHighlighter.registerLanguage("css", css)
SyntaxHighlighter.registerLanguage("html", html)
SyntaxHighlighter.registerLanguage("sql", sql)
SyntaxHighlighter.registerLanguage("yaml", yaml)
SyntaxHighlighter.registerLanguage("markdown", markdownLang)

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WELCOME_SUGGESTIONS = [
  "Generate payroll report for this month",
  "How to calculate overtime with tax deduction?",
  "Add new employee attendance record",
  "Refactor employee leave approval workflow",
  "Create API endpoint for salary slip generation",
  "Optimize database query for HR dashboard",
]

// ---------------------------------------------------------------------------
// CodeBlock
// ---------------------------------------------------------------------------

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  const langLabel = language || "text"

  return (
    <div className="relative group rounded-lg overflow-hidden border my-3 bg-[#282c34]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/10 text-xs text-muted-foreground/80 border-b border-white/5">
        <span>{langLabel}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground/80 transition-colors"
        >
          {copied ? (
            <>
              <IconCheck className="size-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <IconCopy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "transparent",
          padding: "1rem",
          fontSize: "0.8125rem",
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-geist-mono)" },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InlineCode
// ---------------------------------------------------------------------------

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-all">
      {children}
    </code>
  )
}

// ---------------------------------------------------------------------------
// MarkdownRenderer
// ---------------------------------------------------------------------------

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          const value = String(children).replace(/\n$/, "")

          if (!match) {
            return <InlineCode>{children}</InlineCode>
          }

          return <CodeBlock language={match[1]} value={value} />
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse border rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border px-3 py-2 text-left font-semibold bg-muted/50">
              {children}
            </th>
          )
        },
        td({ children }) {
          return <td className="border px-3 py-2">{children}</td>
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 my-2 space-y-0.5">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 my-2 space-y-0.5">{children}</ol>
        },
        p({ children }) {
          return <p className="my-1.5 leading-relaxed">{children}</p>
        },
        h1({ children }) {
          return <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold mt-3 mb-1.5">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold mt-2.5 mb-1">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-primary/30 pl-4 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          )
        },
        hr() {
          return <hr className="my-3 border-border" />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
        <IconSparkles className="size-4 text-primary" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
        <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
        <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
        <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MessageBubble
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
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
            : "bg-muted rounded-bl-md"
        )}
      >
        {isUser ? (
          <>{message.content}</>
        ) : message.content ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          <span className="text-muted-foreground italic">Empty response</span>
        )}
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
// WelcomeScreen
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
// ModelSelector
// ---------------------------------------------------------------------------

function ModelSelector({
  models,
  selectedModel,
  onSelect,
}: {
  models: Model[]
  selectedModel: string
  onSelect: (code: string) => void
}) {
  const activeModels = models.filter((m) => m.is_active)

  // Auto-select first model if none selected
  useEffect(() => {
    if (!selectedModel && activeModels.length > 0) {
      onSelect(activeModels[0].code)
    }
  }, [selectedModel, activeModels, onSelect])

  const selected = activeModels.find((m) => m.code === selectedModel)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium
                     bg-muted/60 hover:bg-muted transition-colors
                     border border-border/50"
        >
          <IconBrain className="size-3 text-primary" />
          <span className="max-w-[100px] truncate">
            {selected?.name ?? "Select model"}
          </span>
          <IconChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Select model
        </DropdownMenuLabel>
        {activeModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onSelect(model.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              selectedModel === model.code && "bg-accent"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{model.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {model.provider}
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">
                  {model.code}
                </span>
              </div>
            </div>
            {selectedModel === model.code && (
              <IconCheck className="size-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        {activeModels.length === 0 && (
          <div className="px-2 py-4 text-xs text-muted-foreground text-center">
            No active models available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// ChatContent
// ---------------------------------------------------------------------------

export interface ChatContentProps {
  activeConversationId: string | null
  conversations: Conversation[]
  onNewChat: () => string
  onConversationUpdate: (
    id: string,
    messages: Message[],
    title?: string
  ) => void
}

export function ChatContent({
  activeConversationId,
  conversations,
  onNewChat,
  onConversationUpdate,
}: ChatContentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const { status, selectedModel, setSelectedModel, sendMessage, stopGeneration } =
    useChatStream()
  const { data: models } = useModels()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isUserNearBottomRef = useRef(true)
  const isSubmittingRef = useRef(false)

  // Sync messages when activeConversationId changes (skip during submission)
  useEffect(() => {
    if (isSubmittingRef.current) return
    if (activeConversationId) {
      const conv = conversations.find((c) => c.id === activeConversationId)
      setMessages(conv?.messages ?? [])
    } else {
      setMessages([])
    }
  }, [activeConversationId, conversations])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current && isUserNearBottomRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Track whether user is near the bottom
  function handleScroll() {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    isUserNearBottomRef.current = nearBottom
  }

  function handleSubmit(promptText?: string) {
    const text = (promptText ?? input).trim()
    if (!text || status === "streaming") return

    isSubmittingRef.current = true

    const userMsg: Message = {
      id: nextId(),
      role: "user",
      content: text,
    }

    const assistantMsg: Message = {
      id: nextId(),
      role: "assistant",
      content: "",
    }

    // If there's no active conversation, create one
    let convId = activeConversationId
    if (!convId) {
      convId = onNewChat()
    }

    const newTitle = messages.length === 0 ? makeTitle(text) : undefined
    const updatedMessages = [...messages, userMsg, assistantMsg]
    setMessages(updatedMessages)
    setInput("")

    // Persist immediately to prevent useEffect from overwriting
    onConversationUpdate(convId, updatedMessages, newTitle)

    // Build API context — send all messages except the empty assistant placeholder
    const context = updatedMessages.filter((m) => m.id !== assistantMsg.id)

    sendMessage(
      context,
      convId,
      selectedModel,
      // onToken
      (token) => {
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + token,
            }
          }
          return updated
        })
      },
      // onDone
      () => {
        isSubmittingRef.current = false
        setMessages((prev) => {
          onConversationUpdate(convId, prev)
          return prev
        })
      },
      // onError
      (err) => {
        isSubmittingRef.current = false
        toast.error(err)
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content
                ? `${last.content}\n\n⚠️ Error: ${err}`
                : `⚠️ ${err}`,
            }
          }
          onConversationUpdate(convId, updated)
          return updated
        })
      }
    )

    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (status !== "streaming") handleSubmit()
    }
  }

  function handleSuggestion(text: string) {
    handleSubmit(text)
  }

  const isWelcome = messages.length === 0
  const isStreaming = status === "streaming"

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <PageHeader>
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <IconSparkles className="size-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium">AI Assistant</span>
      </PageHeader>

      {/* Chat messages — only this scrolls */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {isWelcome ? (
          <WelcomeScreen onSelect={handleSuggestion} />
        ) : (
          <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1]?.role === "assistant" &&
              !messages[messages.length - 1]?.content && (
                <TypingIndicator />
              )}
          </div>
        )}
      </div>

      {/* Input bar — pinned at bottom */}
      <div className="shrink-0 sticky z-10 px-4 pb-4 pt-2">
        <div
          className={cn(
            "rounded-2xl border bg-background/80 backdrop-blur-md shadow-lg",
            "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
            "transition-all duration-200"
          )}
        >
          {/* Top toolbar — model selector */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />
            <span className="text-[10px] text-muted-foreground/40 select-none hidden sm:block">
              shift + enter for new line
            </span>
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              "w-full border-0 bg-transparent shadow-none resize-none",
              "placeholder:text-muted-foreground/50",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-0 max-h-32 py-1 px-3 pb-2.5 overflow-y-auto"
            )}
          />

          {/* Bottom bar — send/stop button */}
          <div className="flex items-center justify-end px-2 pb-2">
            {isStreaming ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={stopGeneration}
                className="h-8 shrink-0 rounded-lg text-red-500 hover:bg-red-500/10 gap-1.5"
              >
                <IconPlayerStop className="size-3.5" />
                <span className="text-xs">Stop</span>
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSubmit()}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
