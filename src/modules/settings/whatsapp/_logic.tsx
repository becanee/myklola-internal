// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStatus = "pending" | "connected" | "disconnected" | "error"

export type ConnectMethod = "qr" | "pairing"

export interface WhatsAppSession {
  id: string
  phone_number: string | null
  device_name: string
  status: SessionStatus
  last_active: string | null
  created_at: string
}

export interface CreateSessionResponse {
  sessionId: string
  qrCode?: string
  pairingCode?: string
  status: SessionStatus
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_SESSIONS: WhatsAppSession[] = [
  {
    id: "1",
    phone_number: "6281234567890",
    device_name: "iPhone 15",
    status: "connected",
    last_active: new Date(Date.now() - 120_000).toISOString(),
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "2",
    phone_number: "6289876543210",
    device_name: "Galaxy S24",
    status: "connected",
    last_active: new Date(Date.now() - 3_600_000).toISOString(),
    created_at: "2026-06-15T14:30:00Z",
  },
  {
    id: "3",
    phone_number: null,
    device_name: "Desktop Chrome",
    status: "pending",
    last_active: null,
    created_at: "2026-06-28T09:00:00Z",
  },
  {
    id: "4",
    phone_number: null,
    device_name: "MacBook Pro",
    status: "disconnected",
    last_active: "2026-06-20T08:00:00Z",
    created_at: "2026-06-10T16:00:00Z",
  },
]

// 1x1 placeholder – will be replaced with real QR code later
export const MOCK_QR_CODE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

export const MOCK_PAIRING_CODE = "4821-9537"

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function generateSessionId(): string {
  return crypto.randomUUID()
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
