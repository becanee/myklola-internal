import { useState, useEffect, useCallback } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { get, post, patch, del } from "@/req/base_req"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Model {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string
  provider: string
  code: string
  name: string
  context_length: number
  price_input: number
  price_cache: number
  price_output: number
  idr_rate: number
  is_active: boolean
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

export interface ModelFormData {
  updated_by: string
  provider: string
  code: string
  name: string
  context_length: number
  price_input: number
  price_cache: number
  price_output: number
  idr_rate: number
  is_active: boolean
}

// ---------------------------------------------------------------------------
// useModels
// ---------------------------------------------------------------------------

export function useModels() {
  const { session } = useSession()
  const [data, setData] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await get<ApiResponse<Model[]>>("/models", { sessionId: session?.id })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) fetchModels()
  }, [session?.id, fetchModels])

  return { data, loading, error, refetch: fetchModels }
}

// ---------------------------------------------------------------------------
// useModelDetail
// ---------------------------------------------------------------------------

export function useModelDetail() {
  const { session } = useSession()
  const [data, setData] = useState<Model | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await get<ApiResponse<Model>>("/models/detail", {
        sessionId: session?.id, params: { id },
      })
      setData(res.data.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch model detail")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  return { data, loading, error, fetchDetail }
}

// ---------------------------------------------------------------------------
// useCreateModel
// ---------------------------------------------------------------------------

export function useCreateModel() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (formData: ModelFormData): Promise<{ ok: boolean; message: string }> => {
    setLoading(true)
    try {
      const res = await post<ApiResponse<Model>>("/models/create", formData, { sessionId: session?.id })
      return { ok: true, message: res.data.message ?? "Model created successfully" }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to create model" }
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  return { loading, create }
}

// ---------------------------------------------------------------------------
// useUpdateModel
// ---------------------------------------------------------------------------

export function useUpdateModel() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, formData: ModelFormData): Promise<{ ok: boolean; message: string }> => {
    setLoading(true)
    try {
      const res = await patch<ApiResponse<Model>>("/models/update", formData, {
        sessionId: session?.id, params: { id },
      })
      return { ok: true, message: res.data.message ?? "Model updated successfully" }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to update model" }
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  return { loading, update }
}

// ---------------------------------------------------------------------------
// useDeleteModel
// ---------------------------------------------------------------------------

export function useDeleteModel() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(async (id: string): Promise<{ ok: boolean; message: string }> => {
    setLoading(true)
    try {
      const res = await del<ApiResponse<null>>("/models/delete", {
        sessionId: session?.id, params: { id },
      })
      return { ok: true, message: res.data.message ?? "Model deleted successfully" }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to delete model" }
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  return { loading, remove }
}

// ---------------------------------------------------------------------------
// useModelFormDefaults — get updated_by from logged-in user
// ---------------------------------------------------------------------------

export function useModelFormDefaults(): string {
  const { user } = useUser()
  return user?.id ?? ""
}