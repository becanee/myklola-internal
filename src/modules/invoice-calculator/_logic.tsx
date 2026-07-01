import { useSession, useUser } from "@clerk/nextjs"
import { get, post, patch, del } from "@/req/base_req"
import { useState, useEffect, useCallback } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PRICING_TYPES = ["FIXED", "PER_EMPLOYEE", "PERCENTAGE"] as const
export type PricingType = (typeof PRICING_TYPES)[number]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TierRate {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string
  sequence: number
  from: number
  to: number
  template_code: string
  pricing_type: string
  amount: number
  effective_from: string
  effective_until: string
  is_active: boolean
  tier_name: string
}

export interface TierRateFormData {
  updated_by: string
  tier_name: string
  template_code: string
  sequence: number
  from: number
  to: number
  pricing_type: string
  amount: number
  effective_from: string
  effective_until: string
  is_active: boolean
}

export interface ApiResponse<T> {
  status: boolean
  httpCode: number
  poweredBy: string
  data: T
  message?: string
}

export interface TierAllocation {
  tier: TierRate
  allocatedEmployees: number
  subtotal: number
}

export interface CalculationResult {
  totalEmployees: number
  allocations: TierAllocation[]
  grandTotal: number
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export function useClientFormDefaults(): string {
  const { user } = useUser()
  return user?.id ?? ""
}

// ---------------------------------------------------------------------------
// Pure function — distribute employees across tiers and calculate pricing
// ---------------------------------------------------------------------------

/**
 * Distributes total employees across tier ranges and calculates pricing.
 *
 * Tiers are sorted by `sequence` ASC internally.
 *
 * Algorithm:
 * - Each tier covers [from, to] inclusive (handles from > to gracefully).
 * - Allocate min(rangeSize, remaining) employees to each tier.
 * - Only tiers with allocated employees > 0 are included.
 * - PER_EMPLOYEE: subtotal = allocated × amount
 * - FIXED: subtotal = amount (no multiplication)
 * - Remaining employees spill into the last tier.
 */
export function calculateTierPricing(
  totalEmployee: number,
  tiers: TierRate[]
): CalculationResult {
  const sorted = [...tiers].sort((a, b) => a.sequence - b.sequence)
  const allocations: TierAllocation[] = []
  let remaining = totalEmployee

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i]
    const isLast = i === sorted.length - 1
    const rangeSize = Math.abs(tier.to - tier.from) + 1
    const allocated = isLast
      ? remaining
      : Math.min(rangeSize, remaining)

    if (allocated <= 0) break

    const subtotal =
      tier.pricing_type === "FIXED"
        ? tier.amount
        : allocated * tier.amount

    allocations.push({ tier, allocatedEmployees: allocated, subtotal })
    remaining -= allocated

    if (remaining <= 0) break
  }

  const grandTotal = allocations.reduce((sum, a) => sum + a.subtotal, 0)

  return { totalEmployees: totalEmployee, allocations, grandTotal }
}

// ===========================================================================
// Tier Rates — Hooks
// ===========================================================================

export function useTierRates() {
  const { session } = useSession()
  const [data, setData] = useState<TierRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTierRates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await get<ApiResponse<TierRate[]>>("/tier-rates", {
        sessionId: session?.id,
      })
      setData(res.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tier rates")
    } finally {
      setLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    if (session?.id) {
      fetchTierRates()
    }
  }, [session?.id, fetchTierRates])

  return { data, loading, error, refetch: fetchTierRates }
}

export function useTierRateDetail() {
  const { session } = useSession()
  const [data, setData] = useState<TierRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const res = await get<ApiResponse<TierRate>>("/tier-rates/detail", {
          sessionId: session?.id,
          params: { id },
        })
        setData(res.data.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tier rate detail")
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { data, loading, error, fetchDetail }
}

export function useCreateTierRate() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const create = useCallback(
    async (formData: TierRateFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await post<ApiResponse<TierRate>>("/tier-rates/create", formData, {
          sessionId: session?.id,
        })
        return { ok: true, message: res.data.message ?? "Tier rate created successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to create tier rate" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, create }
}

export function useUpdateTierRate() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const update = useCallback(
    async (id: string, formData: TierRateFormData): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await patch<ApiResponse<TierRate>>("/tier-rates/update", formData, {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Tier rate updated successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to update tier rate" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, update }
}

export function useDeleteTierRate() {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; message: string }> => {
      setLoading(true)

      try {
        const res = await del<ApiResponse<null>>("/tier-rates/delete", {
          sessionId: session?.id,
          params: { id },
        })
        return { ok: true, message: res.data.message ?? "Tier rate deleted successfully" }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Failed to delete tier rate" }
      } finally {
        setLoading(false)
      }
    },
    [session?.id]
  )

  return { loading, remove }
}
