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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  IconAlertCircle, IconBrain,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useCreateModel,
  useDeleteModel,
  useModelDetail,
  useModelFormDefaults,
  useModels,
  useUpdateModel,
  type Model, type ModelFormData,
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

function formatPrice(val: number): string {
  return val < 1 ? `$${val.toFixed(3)}` : `$${val.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const headers = ["Name", "Provider", "Code", "Context", "Pricing", "Actions"]

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
              <TableCell><Skeleton className="h-5 w-36" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="size-8 rounded-lg" />
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
  model, loading, open, onOpenChange,
}: {
  model: Model | null; loading: boolean; open: boolean; onOpenChange: (v: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Model Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        {loading || !model ? (
          <div className="flex flex-col gap-5 mt-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Separator />
            {Array.from({ length: 6 }).map((_, i) => (
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
                <IconBrain className="size-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold">{model.name}</h3>
                <Badge variant="secondary" className="mt-1.5">{model.provider}</Badge>
              </div>
              <Badge variant={model.is_active ? "default" : "secondary"}>
                {model.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Info</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Name" value={model.name} />
                <DetailRow label="Code" value={model.code} />
                <DetailRow label="Provider" value={model.provider} />
                <DetailRow label="Context Length" value={model.context_length.toLocaleString()} />
                <DetailRow label="IDR Rate" value={model.idr_rate.toLocaleString()} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Pricing (per 1M tokens)</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Input" value={formatPrice(model.price_input)} />
                <DetailRow label="Cache" value={formatPrice(model.price_cache)} />
                <DetailRow label="Output" value={formatPrice(model.price_output)} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Timestamps</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Created" value={formatDateTime(model.created_at)} />
                <DetailRow label="Updated" value={model.updated_at ? formatDateTime(model.updated_at) : "—"} />
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

const emptyForm: ModelFormData = {
  updated_by: "", provider: "", code: "", name: "",
  context_length: 128000, price_input: 0, price_cache: 0, price_output: 0,
  idr_rate: 0,
  is_active: true,
}

function ModelFormDialog({
  open, onOpenChange, initial, onSave, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  initial: ModelFormData | null; onSave: (data: ModelFormData) => Promise<boolean>; loading: boolean
}) {
  const updatedBy = useModelFormDefaults()
  const [form, setForm] = useState<ModelFormData>(emptyForm)

  useEffect(() => {
    setForm(initial ?? emptyForm)
  }, [initial, open])

  useEffect(() => {
    setForm((p) => ({ ...p, updated_by: updatedBy }))
  }, [updatedBy])

  function update<K extends keyof ModelFormData>(k: K, v: ModelFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
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
            <DialogTitle>{isEdit ? "Edit Model" : "Create Model"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Claude Opus 4.8" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-provider">Provider</Label>
                <Input id="m-provider" value={form.provider} onChange={(e) => update("provider", e.target.value)} placeholder="e.g. anthropic" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-code">Code</Label>
                <Input id="m-code" value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. claude-opus-4-8" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-context">Context Length</Label>
              <Input id="m-context" type="number" value={form.context_length} onChange={(e) => update("context_length", Number(e.target.value))} required />
            </div>

            <fieldset className="rounded-xl border p-4">
              <legend className="text-xs font-medium text-muted-foreground px-1">Pricing per 1M tokens</legend>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="m-price-input">Input ($)</Label>
                  <Input id="m-price-input" type="number" step="0.001" value={form.price_input} onChange={(e) => update("price_input", Number(e.target.value))} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="m-price-cache">Cache ($)</Label>
                  <Input id="m-price-cache" type="number" step="0.001" value={form.price_cache} onChange={(e) => update("price_cache", Number(e.target.value))} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="m-price-output">Output ($)</Label>
                  <Input id="m-price-output" type="number" step="0.001" value={form.price_output} onChange={(e) => update("price_output", Number(e.target.value))} required />
                </div>
              </div>
            </fieldset>

            <div className="flex items-center justify-between">
              <Label htmlFor="m-active">Active</Label>
              <Switch id="m-active" checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-idr-rate">IDR Rate</Label>
              <Input id="m-idr-rate" type="number" step="0.01" value={form.idr_rate} onChange={(e) => update("idr_rate", Number(e.target.value))} required />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.name.trim() || !form.provider.trim()}>
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

function ModelsContent() {
  const { data: models, loading, error, refetch } = useModels()
  const { data: detailModel, loading: detailLoading, fetchDetail } = useModelDetail()
  const { loading: creating, create } = useCreateModel()
  const { loading: updating, update } = useUpdateModel()
  const { loading: deleting, remove } = useDeleteModel()
  const updatedBy = useModelFormDefaults()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null)

  function handleView(model: Model) {
    setSelectedModel(model)
    setSheetOpen(true)
    fetchDetail(model.id)
  }

  function handleCreate() {
    setEditingModel(null)
    setFormOpen(true)
  }

  function handleEdit(model: Model) {
    setEditingModel(model)
    setFormOpen(true)
  }

  async function handleSave(data: ModelFormData): Promise<boolean> {
    const payload = { ...data, updated_by: updatedBy || data.updated_by }
    if (editingModel) {
      const { ok, message } = await update(editingModel.id, payload)
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
              <BreadcrumbLink href="/">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Models</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button size="sm" onClick={handleCreate}>
            <IconPlus className="size-4" />
            <span className="ml-1.5">New Model</span>
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

        {!loading && !error && models.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No models found</p>
          </div>
        )}

        {!loading && !error && models.length > 0 && (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Pricing (I/C/O)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} className="cursor-pointer" onClick={() => handleView(model)}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell><Badge variant="outline">{model.provider}</Badge></TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{model.code}</code>
                    </TableCell>
                    <TableCell className="text-sm">{model.context_length.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {formatPrice(model.price_input)} / {formatPrice(model.price_cache)} / {formatPrice(model.price_output)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(model) }}>
                          <IconPencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(model) }}>
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

      <DetailSheet model={detailModel ?? selectedModel} loading={detailLoading} open={sheetOpen} onOpenChange={setSheetOpen} />

      <ModelFormDialog
        open={formOpen} onOpenChange={setFormOpen}
        initial={editingModel ? {
          updated_by: updatedBy, provider: editingModel.provider, code: editingModel.code,
          name: editingModel.name, context_length: editingModel.context_length,
          price_input: editingModel.price_input, price_cache: editingModel.price_cache,
          price_output: editingModel.price_output, idr_rate: editingModel.idr_rate,
          is_active: editingModel.is_active,
        } : null}
        onSave={handleSave} loading={creating || updating}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
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

export function ModelsPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar onModeChange={setMode} />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <ModelsContent /> : <ChatContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}