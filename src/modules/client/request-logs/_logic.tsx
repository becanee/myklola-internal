import { useState, useEffect, useCallback } from "react"
import { useSession } from "@clerk/nextjs"
import { get } from "@/req/base_req"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokensDetails {
  audio_tokens: number
  cached_tokens: number
}

export interface CompletionTokensDetails {
  accepted_prediction_tokens: number
  audio_tokens: number
  reasoning_tokens: number
  rejected_prediction_tokens: number
}

export interface Tokens {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_tokens_details: TokensDetails
  completion_tokens_details: CompletionTokensDetails
}

export interface Costs {
  cost_input_usd: number
  cost_cached_usd: number
  cost_output_usd: number
  total_cost_usd: number
  total_cost_idr: number
  formatted_idr: string
}

export interface RequestLog {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string | null
  client: string
  model: string
  mode: string
  status: boolean
  http_code: number
  tokens: Tokens
  costs: Costs
  result: unknown
  raw: unknown
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

// ---------------------------------------------------------------------------
// useRequestLogs — fetch request log list
// ---------------------------------------------------------------------------

export function useRequestLogs() {
  const { session } = useSession()
  const [data, setData] = useState<RequestLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await get<ApiResponse<RequestLog[]>>("/request_logs", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch request logs")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) {
      fetchLogs()
    }
  }, [session?.id, fetchLogs])

  return { data, loading, error, refetch: fetchLogs }
}
