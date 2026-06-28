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
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { type AppMode, PageHeader } from "@/modules/shared"
import {
  IconAlertCircle,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  nameToKey,
  type Role,
  type RoleFormData,
  useCreateRole,
  useDeleteRole,
  useRoleDetail,
  useRoles,
  useUpdateRole,
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
  const headers = ["Name", "Key", "Description", "Status", "Created", "Actions"]

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
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-52" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
// Detail sheet
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

function DetailSheet({
  role,
  loading,
  open,
  onOpenChange,
}: {
  role: Role | null
  loading: boolean
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Role Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        {loading || !role ? (
          <div className="flex flex-col gap-5 mt-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Separator />
            {Array.from({ length: 5 }).map((_, i) => (
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
                <IconShield className="size-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold">{role.name}</h3>
                <Badge variant="secondary" className="mt-1.5">{role.key}</Badge>
              </div>
              <Badge variant={role.is_active ? "default" : "secondary"}>
                {role.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Info</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Name" value={role.name} />
                <DetailRow label="Key" value={role.key} />
                <DetailRow label="Description" value={role.description} />
                <DetailRow label="Active" value={role.is_active ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Timestamps</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Created" value={formatDateTime(role.created_at)} />
                <DetailRow label="Updated" value={role.updated_at ? formatDateTime(role.updated_at) : "—"} />
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

const emptyForm: RoleFormData = { name: "", key: "", description: "", is_active: true }

function RoleFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: RoleFormData | null
  onSave: (data: RoleFormData) => Promise<boolean>
  loading: boolean
}) {
  const [form, setForm] = useState<RoleFormData>(emptyForm)

  useEffect(() => {
    setForm(initial ?? emptyForm)
  }, [initial, open])

  function update<K extends keyof RoleFormData>(k: K, v: RoleFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [k]: v }
      if (k === "name") {
        next.key = nameToKey(v as string)
      }
      return next
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
            <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-name">Name</Label>
              <Input
                id="r-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Helpdesk"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-key">Key</Label>
              <Input id="r-key" value={form.key} disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-desc">Description</Label>
              <Textarea
                id="r-desc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="r-active">Active</Label>
              <Switch
                id="r-active"
                checked={form.is_active}
                onCheckedChange={(v) => update("is_active", v)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
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

function RolesContent() {
  const { data: roles, loading, error, refetch } = useRoles()
  const { data: detailRole, loading: detailLoading, fetchDetail } = useRoleDetail()
  const { loading: creating, create } = useCreateRole()
  const { loading: updating, update } = useUpdateRole()
  const { loading: deleting, remove } = useDeleteRole()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  function handleView(role: Role) {
    setSelectedRole(role)
    setSheetOpen(true)
    fetchDetail(role.id)
  }

  function handleCreate() {
    setEditingRole(null)
    setFormOpen(true)
  }

  function handleEdit(role: Role) {
    setEditingRole(role)
    setFormOpen(true)
  }

  async function handleSave(data: RoleFormData): Promise<boolean> {
    if (editingRole) {
      const { ok, message } = await update(editingRole.id, data)
      toast[ok ? "success" : "error"](message)
      if (ok) refetch()
      return ok
    }
    const { ok, message } = await create(data)
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
              <BreadcrumbPage>Roles</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button size="sm" onClick={handleCreate}>
            <IconPlus className="size-4" />
            <span className="ml-1.5">New Role</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <IconRefresh className="size-4" />
          </Button>
        </div>

        {/* Error */}
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

        {/* Loading */}
        {loading && <TableSkeleton />}

        {/* Empty */}
        {!loading && !error && roles.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No roles found</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && roles.length > 0 && (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer"
                    onClick={() => handleView(role)}
                  >
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{role.key}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-56 truncate">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(role.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => { e.stopPropagation(); handleEdit(role) }}
                        >
                          <IconPencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(role) }}
                        >
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

      {/* Detail sheet */}
      <DetailSheet
        role={detailRole ?? selectedRole}
        loading={detailLoading}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Create / Edit dialog */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={
          editingRole
            ? { name: editingRole.name, key: editingRole.key, description: editingRole.description, is_active: editingRole.is_active }
            : null
        }
        onSave={handleSave}
        loading={creating || updating}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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

export function RolesPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar onModeChange={setMode} />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <RolesContent /> : <ChatContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}
