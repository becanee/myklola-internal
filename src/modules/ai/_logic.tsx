import { useState, useEffect, useCallback, useRef } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

export type StreamStatus = "idle" | "streaming" | "done" | "error"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getApiChatUrl(): string {
  return process.env.NEXT_PUBLIC_AI_CHAT_URL ?? "https://ai.myklola.cloud/v1"
}

function getApiChatKey(): string {
  return process.env.NEXT_PUBLIC_AI_CHAT_API_KEY ?? ""
}

export function nextId(): string {
  return crypto.randomUUID()
}

/** Generate conversation title from the first user message (max 40 chars) */
export function makeTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ")
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "…" : cleaned
}

// ---------------------------------------------------------------------------
// localStorage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "klola_chat_conversations"

// ---------------------------------------------------------------------------
// useChatHistory — conversation CRUD backed by localStorage
// ---------------------------------------------------------------------------

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw)
        setConversations(parsed)
        if (parsed.length > 0) {
          setActiveId(parsed[0].id)
        }
      }
    } catch {
      // corrupt data — start fresh
    }
    setLoaded(true)
  }, [])

  // Persist on change (skip initial load to avoid clearing)
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch {
      // localStorage full — silently degrade
    }
  }, [conversations, loaded])

  const createConversation = useCallback(() => {
    const conv: Conversation = {
      id: nextId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    return conv.id
  }, [])

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id)
        // If deleting the active conversation, switch to the first available
        if (id === activeId) {
          setActiveId(filtered.length > 0 ? filtered[0].id : null)
        }
        return filtered
      })
    },
    [activeId]
  )

  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const updateConversationMessages = useCallback(
    (id: string, messages: Message[], title?: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                messages,
                title: title ?? c.title,
                updatedAt: Date.now(),
              }
            : c
        )
      )
    },
    []
  )

  return {
    conversations,
    activeId,
    loaded,
    createConversation,
    deleteConversation,
    selectConversation,
    updateConversationMessages,
  }
}

// ---------------------------------------------------------------------------
// useChatStream — SSE streaming via fetch + ReadableStream
// ---------------------------------------------------------------------------

export function useChatStream() {
  const [status, setStatus] = useState<StreamStatus>("idle")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (
      messages: Message[],
      conversationId: string,
      model: string,
      onToken: (token: string) => void,
      onDone: () => void,
      onError: (err: string) => void
    ) => {
      const controller = new AbortController()
      abortRef.current = controller
      setStatus("streaming")

      // Build API-compatible messages array (remove id, keep role + content)
      const apiMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            // conversation_id: conversationId,
            stream: true,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let errMsg = `API error: ${res.status}`
          try {
            const errBody = await res.json()
            errMsg = errBody.error?.message ?? errMsg
          } catch {
            // body not JSON
          }
          onError(errMsg)
          setStatus("error")
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          onError("No response body")
          setStatus("error")
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE lines: each event is separated by "\n\n"
          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""

          for (const event of events) {
            const lines = event.split("\n")
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith("data: ")) continue

              const raw = trimmed.slice(6)

              // OpenAI-compatible [DONE] marker
              if (raw === "[DONE]") {
                onDone()
                setStatus("done")
                return
              }

              try {
                const parsed = JSON.parse(raw)
                // OpenAI-compatible: choices[0].delta.content
                const content: string | undefined =
                  parsed.choices?.[0]?.delta?.content
                if (content) {
                  onToken(content)
                }
                // Check for finish_reason
                if (parsed.choices?.[0]?.finish_reason) {
                  onDone()
                  setStatus("done")
                  return
                }
              } catch {
                // malformed JSON — skip this line
              }
            }
          }
        }

        // Stream ended without [DONE]
        onDone()
        setStatus("done")
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled — keep partial content, reset status
          setStatus("idle")
          return
        }
        const msg = err instanceof Error ? err.message : "Network error"
        onError(msg)
        setStatus("error")
      } finally {
        abortRef.current = null
      }
    },
    []
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus("idle")
  }, [])

  return { status, selectedModel, setSelectedModel, sendMessage, stopGeneration }
}
