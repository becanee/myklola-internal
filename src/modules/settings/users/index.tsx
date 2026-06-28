"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { type AppMode, PageHeader } from "@/modules/shared"
import {
  IconAlertCircle, IconCircleFilled,
  IconPencil,
  IconRefresh,
  IconTrash
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useDeleteUser,
  type User, type UserFormData,
  useRolesList,
  useUpdateUser,
  useUserDetail,
  useUsers,
} from "./_logic"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

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

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  const headers = ["User", "Email", "Role", "Status", "Last Active", "Actions"]

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
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
// User detail sheet
// ---------------------------------------------------------------------------

function UserDetailSheet({
  user, loading, open, onOpenChange,
}: {
  user: User | null; loading: boolean; open: boolean; onOpenChange: (v: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>User Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        {loading || !user ? (
          <div className="flex flex-col gap-5 mt-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Separator />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-6">
            <div className="rounded-xl bg-muted/50 p-4 flex flex-col items-center gap-3">
              <Avatar className="size-16">
                <AvatarImage src={user.avatar} alt={user.first_name} />
                <AvatarFallback className="text-lg">{initials(user.first_name)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-base font-semibold">{user.first_name} {user.last_name}</h3>
                <Badge variant="secondary" className="mt-1.5">{user.role.name}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <IconCircleFilled className={cn("size-2", user.is_online ? "text-green-500" : "text-muted-foreground/40")} />
                <span className="text-xs text-muted-foreground">{user.is_online ? "Online" : "Offline"}</span>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Contact</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="First Name" value={user.first_name} />
                <DetailRow label="Last Name" value={user.last_name} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Session</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Client IP" value={user.client_ip} />
                <DetailRow label="Last Active" value={formatDateTime(user.last_active)} />
                <DetailRow label="Created" value={formatDateTime(user.created_at)} />
                <DetailRow label="Locked" value={user.locked ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Device</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="User Agent" value={user.user_agent} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

const emptyUserForm: UserFormData = { first_name: "", last_name: "", role: "", locked: false }

function EditUserDialog({
  open, onOpenChange, user, onSave, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  user: User | null; onSave: (data: UserFormData) => Promise<boolean>; loading: boolean
}) {
  const { data: roles } = useRolesList()
  const [form, setForm] = useState<UserFormData>(emptyUserForm)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.key,
        locked: user.locked,
      })
    } else {
      setForm(emptyUserForm)
    }
  }, [user, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await onSave(form)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="u-fname">First Name</Label>
              <Input
                id="u-fname" value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="u-lname">Last Name</Label>
              <Input
                id="u-lname" value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="u-role">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger id="u-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter((r) => r.is_active).map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="u-locked">Locked</Label>
              <Switch
                id="u-locked" checked={form.locked}
                onCheckedChange={(v) => setForm((p) => ({ ...p, locked: v }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.first_name.trim()}>
              {loading ? "Saving..." : "Save Changes"}
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

function UsersContent() {
  const { data: users, loading, error, refetch } = useUsers()
  const { data: detailUser, loading: detailLoading, fetchDetail } = useUserDetail()
  const { loading: updating, update } = useUpdateUser()
  const { loading: deleting, remove } = useDeleteUser()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  function handleView(user: User) {
    setSelectedUser(user)
    setSheetOpen(true)
    fetchDetail(user.id)
  }

  function handleEdit(user: User) {
    setEditingUser(user)
    setEditOpen(true)
  }

  async function handleSave(data: UserFormData): Promise<boolean> {
    if (!editingUser) return false
    const { ok, message } = await update(editingUser.id, data)
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
              <BreadcrumbPage>Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
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

        {!loading && !error && users.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => handleView(user)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={user.avatar} alt={user.first_name} />
                          <AvatarFallback className="text-xs">{initials(user.first_name)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role.name}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <IconCircleFilled className={cn("size-2", user.is_online ? "text-green-500" : "text-muted-foreground/40")} />
                        <span className="text-sm">{user.is_online ? "Online" : "Offline"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{relativeTime(user.last_active)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(user) }}>
                          <IconPencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(user) }}>
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

      <UserDetailSheet user={detailUser ?? selectedUser} loading={detailLoading} open={sheetOpen} onOpenChange={setSheetOpen} />

      <EditUserDialog
        open={editOpen} onOpenChange={setEditOpen} user={editingUser}
        onSave={handleSave} loading={updating}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>?
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

export function UsersPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar onModeChange={setMode} />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <UsersContent /> : <ChatContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}
