import { useState, useEffect, useCallback } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { get, post, patch, del } from "@/req/base_req"

// ---------------------------------------------------------------------------
// Access options
// ---------------------------------------------------------------------------

export const ACCESS_OPTIONS = [
  "hr-analysis",
  "kpi-analysis",
  "objective-analysis",
  "task-analysis",
  "kpi-generate",
  "objective-generate",
  "task-generate",
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Client {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string
  klola_id: string
  total_employee: number
  access: string[]
  default_model: string
  fallback_model: string
  is_active: boolean
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

export interface ClientFormData {
  updated_by: string
  klola_id: string
  total_employee: number
  access: string[]
  default_model: string
  fallback_model: string
  is_active: boolean
}

// ---------------------------------------------------------------------------
// useClients — fetch client list
// ---------------------------------------------------------------------------

export function useClients() {
  const { session } = useSession()
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await get<ApiResponse<Client[]>>("/clients", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) {
      fetchClients()
    }
  }, [session?.id, fetchClients])

  return { data, loading, error, refetch: fetchClients }
}

// ---------------------------------------------------------------------------
// useClientDetail — fetch single client detail
// ---------------------------------------------------------------------------

export function useClientDetail() {
  const { session } = useSession()
  const [data, setData] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const res = await get<ApiResponse<Client>>("/clients/detail", {
          sessionId: session?.id,
          params: { id },
        })
        setData(res.data.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch client detail")
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { data, loading, error, fetchDetail }
}

// ---------------------------------------------------------------------------
// useCreateClient
// ---------------------------------------------------------------------------

export function useCreateClient() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const create = useCallback(
    async (formData: ClientFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await post<ApiResponse<Client>>("/clients/create", formData, {
          sessionId: session?.id,
        })
        return { ok: true, message: res.data.message ?? "Client created successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to create client" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, create }
}

// ---------------------------------------------------------------------------
// useUpdateClient
// ---------------------------------------------------------------------------

export function useUpdateClient() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const update = useCallback(
    async (id: string, formData: ClientFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await patch<ApiResponse<Client>>("/clients/update", formData, {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Client updated successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to update client" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, update }
}

// ---------------------------------------------------------------------------
// useDeleteClient
// ---------------------------------------------------------------------------

export function useDeleteClient() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await del<ApiResponse<null>>("/clients/delete", {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Client deleted successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to delete client" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, remove }
}

// ---------------------------------------------------------------------------
// useClientFormDefaults — get updated_by from logged-in user
// ---------------------------------------------------------------------------

export function useClientFormDefaults(): string {
  const { user } = useUser()
  return user?.id ?? ""
}
