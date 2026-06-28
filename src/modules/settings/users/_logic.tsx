import { useState, useEffect, useCallback } from "react"
import { useSession } from "@clerk/nextjs"
import { get, patch, del } from "@/req/base_req"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Role {
  key: string
  name: string
  description: string
}

export interface User {
  id: string
  created_at: string
  updated_at: string | null
  last_active: string
  is_online: boolean
  avatar: string
  email: string
  first_name: string
  last_name: string
  client_ip: string
  user_agent: string
  locked: boolean
  role: Role
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

export interface UserFormData {
  first_name: string
  last_name: string
  role: string // role key
  locked: boolean
}

// ---------------------------------------------------------------------------
// useUsers — fetch user list
// ---------------------------------------------------------------------------

export function useUsers() {
  const { session } = useSession()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await get<ApiResponse<User[]>>("/users", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) {
      fetchUsers()
    }
  }, [session?.id, fetchUsers])

  return { data, loading, error, refetch: fetchUsers }
}

// ---------------------------------------------------------------------------
// useUserDetail — fetch single user detail
// ---------------------------------------------------------------------------

export function useUserDetail() {
  const { session } = useSession()
  const [data, setData] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(
    async (userId: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const res = await get<ApiResponse<User>>("/users/detail", {
          sessionId: session?.id,
          params: { id: userId },
        })
        setData(res.data.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user detail")
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { data, loading, error, fetchDetail }
}

// ---------------------------------------------------------------------------
// useRolesList — fetch roles for select dropdown
// ---------------------------------------------------------------------------

export function useRolesList() {
  const { session } = useSession()
  const [data, setData] = useState<{ key: string; name: string; is_active: boolean }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get<ApiResponse<{ key: string; name: string; is_active: boolean }[]>>("/roles", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) fetchRoles()
  }, [session?.id, fetchRoles])

  return { data, loading }
}

// ---------------------------------------------------------------------------
// useUpdateUser
// ---------------------------------------------------------------------------

export function useUpdateUser() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const update = useCallback(
    async (id: string, formData: UserFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)
      try {
        const res = await patch<ApiResponse<User>>("/users/update", formData, {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "User updated successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to update user" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, update }
}

// ---------------------------------------------------------------------------
// useDeleteUser
// ---------------------------------------------------------------------------

export function useDeleteUser() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)
      try {
        const res = await del<ApiResponse<null>>("/users/delete", {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "User deleted successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to delete user" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, remove }
}
