import { useState, useEffect, useCallback } from "react"
import { useSession } from "@clerk/nextjs"
import { get, post, patch, del } from "@/req/base_req"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Role {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string | null
  name: string
  key: string
  description: string
  is_active: boolean
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

export interface RoleFormData {
  name: string
  key: string
  description: string
  is_active: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function nameToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// ---------------------------------------------------------------------------
// useRoles — fetch role list
// ---------------------------------------------------------------------------

export function useRoles() {
  const { session } = useSession()
  const [data, setData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await get<ApiResponse<Role[]>>("/roles", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) {
      fetchRoles()
    }
  }, [session?.id, fetchRoles])

  return { data, loading, error, refetch: fetchRoles }
}

// ---------------------------------------------------------------------------
// useRoleDetail — fetch single role detail
// ---------------------------------------------------------------------------

export function useRoleDetail() {
  const { session } = useSession()
  const [data, setData] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const res = await get<ApiResponse<Role>>("/roles/detail", {
          sessionId: session?.id,
          params: { id },
        })
        setData(res.data.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch role detail")
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { data, loading, error, fetchDetail }
}

// ---------------------------------------------------------------------------
// useCreateRole — create a role
// ---------------------------------------------------------------------------

export function useCreateRole() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const create = useCallback(
    async (formData: RoleFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await post<ApiResponse<Role>>("/roles/create", formData, {
          sessionId: session?.id,
        })
        return { ok: true, message: res.data.message ?? "Role created successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to create role" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, create }
}

// ---------------------------------------------------------------------------
// useUpdateRole — update a role
// ---------------------------------------------------------------------------

export function useUpdateRole() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const update = useCallback(
    async (id: string, formData: RoleFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await patch<ApiResponse<Role>>("/roles/update", formData, {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Role updated successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to update role" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, update }
}

// ---------------------------------------------------------------------------
// useDeleteRole — delete a role
// ---------------------------------------------------------------------------

export function useDeleteRole() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await del<ApiResponse<null>>("/roles/delete", {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Role deleted successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to delete role" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, remove }
}
