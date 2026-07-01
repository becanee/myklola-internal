"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { useChatHistory } from "@/modules/ai/_logic"
import { type AppMode, PageHeader } from "@/modules/shared"
import {
  IconAlertCircle,
  IconBrandWhatsapp,
  IconCheck,
  IconCircleFilled,
  IconCopy,
  IconDeviceMobile,
  IconPlus,
  IconQrcode,
  IconRefresh,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  type ConnectMethod,
  formatDateTime,
  generateSessionId,
  MOCK_PAIRING_CODE,
  MOCK_QR_CODE,
  MOCK_SESSIONS,
  relativeTime,
  type SessionStatus,
  shortId,
  type WhatsAppSession,
} from "./_logic"

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  const headers = ["Device", "Phone Number", "Status", "Last Active", "Actions"]

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="size-8 rounded-lg" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DeviceTable
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<SessionStatus, { variant: "default" | "secondary" | "outline" | "destructive"; label: string; dotClass: string }> = {
  connected:  { variant: "default",     label: "Connected",    dotClass: "text-green-500" },
  pending:    { variant: "secondary",   label: "Pending",      dotClass: "text-amber-500" },
  disconnected: { variant: "outline",   label: "Disconnected", dotClass: "text-muted-foreground/40" },
  error:      { variant: "destructive", label: "Error",        dotClass: "text-destructive" },
}

function DeviceTable({
  sessions,
  onDisconnect,
}: {
  sessions: WhatsAppSession[]
  onDisconnect: (s: WhatsAppSession) => void
}) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const s = STATUS_STYLE[session.status]
            return (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <IconBrandWhatsapp className="size-4 text-muted-foreground shrink-0" />
                    {session.device_name}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {session.phone_number ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <IconCircleFilled className={cn("size-2 shrink-0", s.dotClass)} />
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {session.last_active ? relativeTime(session.last_active) : "Never"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDisconnect(session)}
                  >
                    <IconTrash className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// QRCodeDisplay
// ---------------------------------------------------------------------------

function QRCodeDisplay({ qrCode, status }: { qrCode: string; status: SessionStatus }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {status === "pending" && (
        <>
          <div className="relative">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="WhatsApp QR Code"
              className="size-64 rounded-xl border bg-white p-3"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
              <div className="flex flex-col items-center gap-3">
                <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">Waiting for scan...</span>
              </div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Scan the QR Code</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt;
              Link a Device, then scan this code.
            </p>
          </div>
        </>
      )}

      {status === "connected" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <IconCheck className="size-8 text-green-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">Device connected successfully!</p>
            <p className="text-sm text-muted-foreground">
              Your WhatsApp device is now linked.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <IconX className="size-8 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">Connection failed</p>
            <p className="text-sm text-muted-foreground">
              The QR code expired or the connection was rejected. Please try again.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PairingCodeForm
// ---------------------------------------------------------------------------

function PairingCodeForm({
  phase,
  phoneNumber,
  onPhoneNumberChange,
  onSubmit,
  pairingCode,
  status,
}: {
  phase: "input" | "code"
  phoneNumber: string
  onPhoneNumberChange: (v: string) => void
  onSubmit: () => void
  pairingCode: string | null
  status: SessionStatus
}) {
  if (phase === "code" && pairingCode) {
    const formatted = pairingCode.replace(/(\d{4})(\d{4})/, "$1-$2")

    return (
      <div className="flex flex-col items-center gap-5 py-6">
        {(status === "pending" || status === "connected") && (
          <>
            <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-10 py-6">
              <span className="text-4xl font-mono font-bold tracking-[0.3em]">
                {formatted}
              </span>
            </div>

            {status === "pending" && (
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">Waiting for confirmation...</span>
              </div>
            )}

            {status === "connected" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                  <IconCheck className="size-7 text-green-500" />
                </div>
                <span className="text-base font-semibold">Device connected!</span>
              </div>
            )}

            <div className="text-center space-y-1 max-w-xs">
              <p className="text-sm font-medium">Enter this code in WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link with
                Phone Number, then enter the code above.
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <IconX className="size-8 text-destructive" />
            </div>
            <p className="text-base font-semibold">Connection failed</p>
            <p className="text-sm text-muted-foreground text-center">
              The pairing failed. Please try again with a new code.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Input phase
  return (
    <div className="flex flex-col gap-5 py-6">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">Link with Phone Number</p>
        <p className="text-xs text-muted-foreground">
          Enter the phone number of the WhatsApp account you want to link.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wa-phone">Phone Number</Label>
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span>+</span>
          </div>
          <Input
            id="wa-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\D/g, ""))}
            placeholder="81234567890"
            className="flex-1"
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={phoneNumber.length < 6}
        className="w-full"
      >
        <IconDeviceMobile className="size-4" />
        <span className="ml-1.5">Generate Code</span>
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AddDeviceDialog
// ---------------------------------------------------------------------------

function AddDeviceDialog({
  open,
  onOpenChange,
  onDeviceAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeviceAdded: (sessionId: string) => void
}) {
  // Stage: "generating" → session created → "ready" (pick method) → "connected"
  type Stage = "generating" | "ready" | "connected"
  const [stage, setStage] = useState<Stage>("generating")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [activeTab, setActiveTab] = useState<ConnectMethod>("qr")
  const [qrStatus, setQrStatus] = useState<SessionStatus>("pending")

  // Pairing state
  const [pairingPhase, setPairingPhase] = useState<"input" | "code">("input")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pairingStatus, setPairingStatus] = useState<SessionStatus>("pending")
  const [pairingCode, setPairingCode] = useState<string | null>(null)

  // Auto-generate session ID when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset all state
    setStage("generating")
    setSessionId(null)
    setActiveTab("qr")
    setQrStatus("pending")
    setPairingPhase("input")
    setPhoneNumber("")
    setPairingStatus("pending")
    setPairingCode(null)
    setCopied(false)

    // Simulate API call to create session
    const timer = setTimeout(() => {
      const id = generateSessionId()
      setSessionId(id)
      setStage("ready")
    }, 1000)

    return () => clearTimeout(timer)
  }, [open])

  function handleOpenChange(open: boolean) {
    if (!open) onOpenChange(false)
  }

  function handleClose() {
    onOpenChange(false)
  }

  function copySessionId() {
    if (!sessionId) return
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true)
      toast.success("Session ID copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleScanSimulate() {
    if (!sessionId) return
    setQrStatus("pending")
    // Simulate scan + connect after 3s
    setTimeout(() => {
      setQrStatus("connected")
      setStage("connected")
      toast.success("WhatsApp device connected successfully")
      setTimeout(() => {
        onDeviceAdded(sessionId!)
        handleClose()
      }, 800)
    }, 3000)
  }

  function handlePairingSubmit() {
    if (!sessionId) return
    setPairingPhase("code")
    setPairingCode(MOCK_PAIRING_CODE)
    setPairingStatus("pending")

    // Simulate connection after 3 seconds
    setTimeout(() => {
      setPairingStatus("connected")
      setStage("connected")
      toast.success("WhatsApp device connected successfully")
      setTimeout(() => {
        onDeviceAdded(sessionId!)
        handleClose()
      }, 800)
    }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add WhatsApp Device</DialogTitle>
          <DialogDescription>
            Connect a new device using QR code or pairing code.
          </DialogDescription>
        </DialogHeader>

        {/* Stage 1: Generating session */}
        {stage === "generating" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Creating session...</p>
              <p className="text-xs text-muted-foreground">
                Generating a unique session ID for your device.
              </p>
            </div>
          </div>
        )}

        {/* Stage 2: Ready — show session ID + tabs */}
        {stage === "ready" && sessionId && (
          <>
            {/* Session ID display */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Session ID</p>
                <code className="text-sm font-mono font-medium break-all">
                  {sessionId}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 size-8"
                onClick={copySessionId}
              >
                {copied ? (
                  <IconCheck className="size-3.5 text-green-500" />
                ) : (
                  <IconCopy className="size-3.5" />
                )}
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConnectMethod)}>
              <TabsList className="w-full mt-2">
                <TabsTrigger value="qr" className="flex-1 gap-1.5">
                  <IconQrcode className="size-4" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="pairing" className="flex-1 gap-1.5">
                  <IconDeviceMobile className="size-4" />
                  Pairing Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="mt-4">
                <QRCodeDisplay qrCode={MOCK_QR_CODE} status={qrStatus} />
                <div className="flex justify-center gap-2 pb-2">
                  {qrStatus === "pending" && (
                    <Button variant="outline" size="sm" onClick={handleScanSimulate}>
                      Simulate Scan
                    </Button>
                  )}
                  {qrStatus === "error" && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => setQrStatus("pending")}>
                        Retry
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pairing" className="mt-4">
                <PairingCodeForm
                  phase={pairingPhase}
                  phoneNumber={phoneNumber}
                  onPhoneNumberChange={setPhoneNumber}
                  onSubmit={handlePairingSubmit}
                  pairingCode={pairingCode}
                  status={pairingStatus}
                />
                <div className="flex justify-center gap-2 pb-2">
                  {pairingPhase === "code" && pairingStatus === "error" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPairingPhase("input")
                          setPairingCode(null)
                          setPairingStatus("pending")
                        }}
                      >
                        Try Again
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Stage 3: Connected */}
        {stage === "connected" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
              <IconCheck className="size-8 text-green-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold">Device connected successfully!</p>
              <p className="text-sm text-muted-foreground">
                Your WhatsApp device is now linked and ready to use.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {(stage === "generating" || stage === "connected") && (
            <Button variant="outline" onClick={handleClose}>
              {stage === "connected" ? "Close" : "Cancel"}
            </Button>
          )}
          {(stage === "ready") && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// WhatsAppDisconnectDialog
// ---------------------------------------------------------------------------

function WhatsAppDisconnectDialog({
  session,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  session: WhatsAppSession | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Device</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disconnect{" "}
            <strong>{session?.device_name}</strong>
            {session?.phone_number ? ` (${session.phone_number})` : ""}?
            This device will no longer be able to send or receive messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Disconnecting..." : "Disconnect"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// WhatsAppContent
// ---------------------------------------------------------------------------

function WhatsAppContent() {
  // Simulated states — toggle between them for testing
  const [viewState, setViewState] = useState<"loading" | "error" | "empty" | "data">("data")
  const [sessions, setSessions] = useState<WhatsAppSession[]>(MOCK_SESSIONS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<WhatsAppSession | null>(null)
  const [deleting, setDeleting] = useState(false)

  function handleAddDevice() {
    setDialogOpen(true)
  }

  function handleDeviceAdded(sessionId: string) {
    // Append a new mock device using the generated session ID
    const short = shortId(sessionId)
    const newDevice: WhatsAppSession = {
      id: sessionId,
      phone_number: "628111222333",
      device_name: `Device ${short}`,
      status: "connected",
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    setSessions((prev) => [...prev, newDevice])
    setViewState("data")
  }

  function handleDisconnect() {
    if (!disconnectTarget) return
    setDeleting(true)
    // Simulate async
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== disconnectTarget.id))
      setDisconnectTarget(null)
      setDeleting(false)
      toast.success(`Disconnected ${disconnectTarget.device_name}`)
    }, 600)
  }

  return (
    <>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Apps</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>WhatsApp</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAddDevice}>
              <IconPlus className="size-4" />
              <span className="ml-1.5">Add Device</span>
            </Button>

            {/* State toggles for testing */}
            <div className="hidden md:flex items-center gap-1 ml-4">
              <span className="text-xs text-muted-foreground mr-1">State:</span>
              {(["data", "loading", "error", "empty"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setViewState(s)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-md border transition-colors",
                    viewState === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setViewState("loading")}>
            <IconRefresh className="size-4" />
          </Button>
        </div>

        {/* Error state */}
        {viewState === "error" && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <IconAlertCircle className="size-4 shrink-0" />
            <span className="flex-1">Unable to connect to WhatsApp service. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => setViewState("data")}>
              <IconRefresh className="size-3.5" />
              <span className="ml-1">Retry</span>
            </Button>
          </div>
        )}

        {/* Loading */}
        {viewState === "loading" && <TableSkeleton />}

        {/* Empty */}
        {viewState === "empty" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/50">
              <IconBrandWhatsapp className="size-10 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-lg font-medium text-muted-foreground">
                No connected devices
              </p>
              <p className="text-sm text-muted-foreground/70 max-w-xs">
                Add a device to start using WhatsApp integration for messaging
                and notifications.
              </p>
            </div>
            <Button onClick={handleAddDevice}>
              <IconPlus className="size-4" />
              <span className="ml-1.5">Add Device</span>
            </Button>
          </div>
        )}

        {/* Table */}
        {viewState === "data" && sessions.length > 0 && (
          <DeviceTable sessions={sessions} onDisconnect={setDisconnectTarget} />
        )}

        {/* If data state but no sessions (after deleting all) */}
        {viewState === "data" && sessions.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/50">
              <IconBrandWhatsapp className="size-10 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-lg font-medium text-muted-foreground">
                No connected devices
              </p>
              <p className="text-sm text-muted-foreground/70 max-w-xs">
                Add a device to start using WhatsApp integration for messaging
                and notifications.
              </p>
            </div>
            <Button onClick={handleAddDevice}>
              <IconPlus className="size-4" />
              <span className="ml-1.5">Add Device</span>
            </Button>
          </div>
        )}
      </div>

      <AddDeviceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDeviceAdded={handleDeviceAdded}
      />

      <WhatsAppDisconnectDialog
        session={disconnectTarget}
        open={!!disconnectTarget}
        onOpenChange={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
        loading={deleting}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function WhatsAppPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")
  const {
    conversations,
    activeId,
    createConversation,
    deleteConversation,
    selectConversation,
    updateConversationMessages,
  } = useChatHistory()

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar
          onModeChange={setMode}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={selectConversation}
          onNewChat={createConversation}
          onDeleteConversation={deleteConversation}
        />
      )}
      <SidebarInset>
        {mode === "dashboard" ? (
          <WhatsAppContent />
        ) : (
          <ChatContent
            activeConversationId={activeId}
            conversations={conversations}
            onNewChat={createConversation}
            onConversationUpdate={updateConversationMessages}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
