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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
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
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { PageHeader, type AppMode } from "@/modules/shared"
import {
  IconAlertCircle,
  IconBuilding,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useModels } from "@/modules/client/models/_logic"
import {
  ACCESS_OPTIONS,
  useClientDetail,
  useClientFormDefaults,
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
  type Client, type ClientFormData,
} from "./_logic"

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

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const headers = ["Klola ID", "Access", "Status", "Created", "Actions"]

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
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="size-8 rounded-lg" />
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
// Detail row
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-all">
        {value || "—"}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail sheet
// ---------------------------------------------------------------------------

function DetailSheet({
  client, loading, open, onOpenChange,
}: {
  client: Client | null; loading: boolean; open: boolean; onOpenChange: (v: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Client Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        {loading || !client ? (
          <div className="flex flex-col gap-5 mt-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Separator />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-6">
            <div className="rounded-xl bg-muted/50 p-4 flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <IconBuilding className="size-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold">{client.klola_id}</h3>
              </div>
              <Badge variant={client.is_active ? "default" : "secondary"}>
                {client.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Info</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Klola ID" value={client.klola_id} />
                <DetailRow label="Default Model" value={client.default_model} />
                <DetailRow label="Fallback Model" value={client.fallback_model} />
                <DetailRow label="Active" value={client.is_active ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Access</p>
              <div className="px-4 pb-3">
                {client.access.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {client.access.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No access</span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Timestamps</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Created" value={formatDateTime(client.created_at)} />
                <DetailRow label="Updated" value={client.updated_at ? formatDateTime(client.updated_at) : "—"} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit Dialog
// ---------------------------------------------------------------------------

const emptyForm: ClientFormData = {
  updated_by: "", klola_id: "", access: [],
  default_model: "", fallback_model: "",
  is_active: true,
}

function ClientFormDialog({
  open, onOpenChange, initial, onSave, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  initial: ClientFormData | null; onSave: (data: ClientFormData) => Promise<boolean>; loading: boolean
}) {
  const updatedBy = useClientFormDefaults()
  const { data: models } = useModels()
  const activeModels = models.filter((m) => m.is_active)
  const [form, setForm] = useState<ClientFormData>(emptyForm)

  useEffect(() => {
    setForm(initial ?? emptyForm)
  }, [initial, open])

  useEffect(() => {
    setForm((p) => ({ ...p, updated_by: updatedBy }))
  }, [updatedBy])

  function update<K extends keyof ClientFormData>(k: K, v: ClientFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function toggleAccess(option: string) {
    setForm((prev) => {
      const next = prev.access.includes(option)
        ? prev.access.filter((a) => a !== option)
        : [...prev.access, option]
      return { ...prev, access: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await onSave(form)
    if (ok) onOpenChange(false)
  }

  const isEdit = !!initial

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Client" : "Create Client"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-updated-by">Updated By</Label>
              <Input id="c-updated-by" value={form.updated_by} disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-klola-id">Klola ID</Label>
              <Input
                id="c-klola-id"
                value={form.klola_id}
                onChange={(e) => update("klola_id", e.target.value)}
                placeholder="e.g. DEV"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-default-model">Default Model</Label>
              <Select value={form.default_model} onValueChange={(v) => update("default_model", v)}>
                <SelectTrigger id="c-default-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {activeModels.map((m) => (
                    <SelectItem key={m.code} value={m.code}>{m.name} ({m.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-fallback-model">Fallback Model</Label>
              <Select value={form.fallback_model} onValueChange={(v) => update("fallback_model", v)}>
                <SelectTrigger id="c-fallback-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {activeModels.map((m) => (
                    <SelectItem key={m.code} value={m.code}>{m.name} ({m.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="rounded-xl border p-4">
              <legend className="text-xs font-medium text-muted-foreground px-1">Access</legend>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ACCESS_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`c-access-${option}`}
                      checked={form.access.includes(option)}
                      onCheckedChange={() => toggleAccess(option)}
                    />
                    <Label htmlFor={`c-access-${option}`} className="text-sm cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center justify-between">
              <Label htmlFor="c-active">Active</Label>
              <Switch
                id="c-active"
                checked={form.is_active}
                onCheckedChange={(v) => update("is_active", v)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.klola_id.trim()}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function DatasContent() {
  const { data: clients, loading, error, refetch } = useClients()
  const { data: detailClient, loading: detailLoading, fetchDetail } = useClientDetail()
  const { loading: creating, create } = useCreateClient()
  const { loading: updating, update } = useUpdateClient()
  const { loading: deleting, remove } = useDeleteClient()
  const updatedBy = useClientFormDefaults()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  function handleView(client: Client) {
    setSelectedClient(client)
    setSheetOpen(true)
    fetchDetail(client.id)
  }

  function handleCreate() {
    setEditingClient(null)
    setFormOpen(true)
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setFormOpen(true)
  }

  async function handleSave(data: ClientFormData): Promise<boolean> {
    const payload = { ...data, updated_by: updatedBy || data.updated_by }
    if (editingClient) {
      const { ok, message } = await update(editingClient.id, payload)
      toast[ok ? "success" : "error"](message)
      if (ok) refetch()
      return ok
    }
    const { ok, message } = await create(payload)
    toast[ok ? "success" : "error"](message)
    if (ok) refetch()
    return ok
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { ok, message } = await remove(deleteTarget.id)
    toast[ok ? "success" : "error"](message)
    if (ok) {
      setDeleteTarget(null)
      refetch()
    }
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
              <BreadcrumbPage>Datas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button size="sm" onClick={handleCreate}>
            <IconPlus className="size-4" />
            <span className="ml-1.5">New Client</span>
          </Button>
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

        {!loading && !error && clients.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No clients found</p>
          </div>
        )}

        {!loading && !error && clients.length > 0 && (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klola ID</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer" onClick={() => handleView(client)}>
                    <TableCell className="font-medium">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{client.klola_id}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.access.slice(0, 3).map((a) => (
                          <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                        ))}
                        {client.access.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{client.access.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(client.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(client) }}>
                          <IconPencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(client) }}>
                          <IconTrash className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DetailSheet client={detailClient ?? selectedClient} loading={detailLoading} open={sheetOpen} onOpenChange={setSheetOpen} />

      <ClientFormDialog
        open={formOpen} onOpenChange={setFormOpen}
        initial={editingClient ? {
          updated_by: updatedBy, klola_id: editingClient.klola_id,
          access: editingClient.access,
          default_model: editingClient.default_model,
          fallback_model: editingClient.fallback_model,
          is_active: editingClient.is_active,
        } : null}
        onSave={handleSave} loading={creating || updating}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.klola_id}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DatasPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar onModeChange={setMode} />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <DatasContent /> : <ChatContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}
