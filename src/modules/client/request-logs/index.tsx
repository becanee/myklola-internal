"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet, SheetContent,
  SheetDescription,
  SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  SidebarInset, SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { useChatHistory } from "@/modules/ai/_logic"
import { PageHeader, type AppMode } from "@/modules/shared"
import {
  IconAlertCircle,
  IconCheck,
  IconFileText,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { useState } from "react"
import { useRequestLogs, type RequestLog } from "./_logic"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  })
}

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

function formatTokens(tokens: RequestLog["tokens"]): string {
  return `${tokens.prompt_tokens.toLocaleString()} / ${tokens.completion_tokens.toLocaleString()} / ${tokens.total_tokens.toLocaleString()}`
}

// ---------------------------------------------------------------------------
// Detail row
// ---------------------------------------------------------------------------

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-right max-w-[60%] break-all", mono && "font-mono text-xs")}>
        {value || "—"}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const headers = ["Client", "Model", "Mode", "Status", "Tokens", "Cost (IDR)", "Created"]

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-18" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail sheet
// ---------------------------------------------------------------------------

function DetailSheet({
  log, open, onOpenChange,
}: {
  log: RequestLog | null; open: boolean; onOpenChange: (v: boolean) => void
}) {
  if (!log) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Request Log Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="flex flex-col gap-5 mt-6">
          {/* Header */}
          <div className="rounded-xl bg-muted/50 p-4 flex flex-col items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <IconFileText className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold">{log.client}</h3>
              <p className="text-sm text-muted-foreground font-mono">{log.model}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{log.mode}</Badge>
              <Badge variant={log.status ? "default" : "destructive"}>
                {log.status ? "Success" : "Failed"}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Info</p>
            <div className="px-4 pb-1.5">
              <DetailRow label="Client" value={log.client} />
              <DetailRow label="Model" value={log.model} mono />
              <DetailRow label="Mode" value={log.mode} />
              <DetailRow label="HTTP Code" value={String(log.http_code)} />
              <DetailRow label="Created" value={formatDateTime(log.created_at)} />
            </div>
          </div>

          {/* Tokens */}
          <div className="rounded-xl bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Tokens</p>
            <div className="px-4 pb-1.5">
              <DetailRow label="Prompt" value={log.tokens.prompt_tokens.toLocaleString()} />
              <DetailRow label="Completion" value={log.tokens.completion_tokens.toLocaleString()} />
              <DetailRow label="Total" value={log.tokens.total_tokens.toLocaleString()} />
            </div>
          </div>

          {/* Costs */}
          <div className="rounded-xl bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Costs</p>
            <div className="px-4 pb-1.5">
              <DetailRow label="Input (USD)" value={`$${log.costs.cost_input_usd.toFixed(6)}`} mono />
              <DetailRow label="Cached (USD)" value={`$${log.costs.cost_cached_usd.toFixed(6)}`} mono />
              <DetailRow label="Output (USD)" value={`$${log.costs.cost_output_usd.toFixed(6)}`} mono />
              <DetailRow label="Total (USD)" value={`$${log.costs.total_cost_usd.toFixed(6)}`} mono />
              <DetailRow label="Total (IDR)" value={log.costs.formatted_idr} />
            </div>
          </div>

          {/* Result */}
          {log.result != null && (
            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Result</p>
              <div className="px-4 pb-3">
                <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {formatJson(log.result)}
                </pre>
              </div>
            </div>
          )}

          {/* Raw */}
          {log.raw != null && (
            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Raw</p>
              <div className="px-4 pb-3">
                <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {formatJson(log.raw)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function RequestLogsContent() {
  const { data: logs, loading, error, refetch } = useRequestLogs()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null)

  function handleView(log: RequestLog) {
    setSelectedLog(log)
    setSheetOpen(true)
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
              <BreadcrumbLink href="/">Clients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Request Logs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar — refresh only */}
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={refetch}>
            <IconRefresh className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <IconAlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <IconRefresh className="size-3.5" />
              <span className="ml-1">Retry</span>
            </Button>
          </div>
        )}

        {loading && <TableSkeleton />}

        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No request logs found</p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost (IDR)</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => handleView(log)}>
                    <TableCell className="font-medium">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.client}</code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">{log.model}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.mode}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <IconCheck className="size-3.5" />
                          <span className="text-sm">{log.http_code}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-destructive">
                          <IconX className="size-3.5" />
                          <span className="text-sm">{log.http_code}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {formatTokens(log.tokens)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {log.costs.formatted_idr}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DetailSheet log={selectedLog} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function RequestLogsPage() {
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
        {mode === "dashboard" ? <RequestLogsContent /> : (
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
