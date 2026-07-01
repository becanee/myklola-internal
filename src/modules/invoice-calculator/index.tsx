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
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { useChatHistory } from "@/modules/ai/_logic"
import { useClients } from "@/modules/client/datas/_logic"
import { PageHeader, type AppMode } from "@/modules/shared"
import {
  IconAlertCircle,
  IconCalculator,
  IconCalendar,
  IconCash,
  IconCheck,
  IconChevronsDown,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  calculateTierPricing,
  PRICING_TYPES,
  useClientFormDefaults,
  useCreateTierRate,
  useDeleteTierRate,
  useTierRateDetail,
  useTierRates,
  useUpdateTierRate,
  type TierAllocation,
  type TierRate,
  type TierRateFormData,
} from "./_logic"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat("id-ID")

function fmt(n: number): string {
  return priceFormatter.format(n)
}

function formatDateOnly(iso: string): string {
  if (!iso) return "--"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-all">
        {value || "--"}
      </span>
    </div>
  )
}

function DatePickerPopover({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const date = value ? new Date(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <IconCalendar className="mr-2 size-4" />
          {date ? formatDateOnly(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? d.toISOString() : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Tier Calculator — Tab 1
// ---------------------------------------------------------------------------

function TierCalculatorContent() {
  const { data: clients, loading: clientsLoading } = useClients()
  const { data: tiers, loading: tiersLoading } = useTierRates()

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("")
  const [payrollEnabled, setPayrollEnabled] = useState(false)
  const [payrollSpecialistFee, setPayrollSpecialistFee] = useState(0)
  const [editedEmployees, setEditedEmployees] = useState<Record<string, number>>({})
  const [editedPayrollSpecialist, setEditedPayrollSpecialist] = useState<Record<string, number>>({})

  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id))
  const totalEmployee = selectedClients.reduce((sum, c) => sum + c.total_employee, 0)

  function toggleClient(id: string) {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function removeClient(id: string) {
    setSelectedClientIds((prev) => prev.filter((x) => x !== id))
  }

  // Unique template codes from all tiers
  const templateCodes = [...new Set(tiers.map((t) => t.template_code).filter(Boolean))].sort()

  // Filter tiers by selected template
  const filteredTiers = selectedTemplateCode
    ? tiers.filter((t) => t.template_code === selectedTemplateCode)
    : []

  const result = useMemo(() => {
    if (filteredTiers.length > 0 && totalEmployee > 0) {
      return calculateTierPricing(totalEmployee, filteredTiers)
    }
    return null
  }, [filteredTiers, totalEmployee])

  // Apply manual employee overrides
  const displayResult = useMemo(() => {
    if (!result) return null
    const allocations = result.allocations.map((a: TierAllocation) => {
      const emp = editedEmployees[a.tier.id] ?? a.allocatedEmployees
      const subtotal =
        a.tier.pricing_type === "FIXED"
          ? a.tier.amount
          : emp * a.tier.amount
      return { ...a, allocatedEmployees: emp, subtotal }
    })
    const grandTotal = allocations.reduce((s, a) => s + a.subtotal, 0)
    return { ...result, allocations, grandTotal }
  }, [result, editedEmployees])

  return (
    <div className="flex flex-col gap-6">
      {/* Client Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 max-w-sm">
              <Label>Clients</Label>
              {clientsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between font-normal",
                        selectedClientIds.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {selectedClientIds.length > 0
                        ? `${selectedClientIds.length} client${selectedClientIds.length > 1 ? "s" : ""} selected`
                        : "Choose clients..."}
                      <IconChevronsDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search clients..." />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => {
                            const isSelected = selectedClientIds.includes(c.id)
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.klola_id}
                                onSelect={() => toggleClient(c.id)}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="pointer-events-none"
                                />
                                <span className="flex-1">{c.klola_id}</span>
                                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                  {c.total_employee} emp
                                </Badge>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Selected client chips */}
            {selectedClients.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                  <IconUsers className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-sm font-semibold">{fmt(totalEmployee)} employees</span>
                </div>
                {selectedClients.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span>{c.klola_id}</span>
                    <span className="text-muted-foreground">({c.total_employee})</span>
                    <button
                      onClick={() => removeClient(c.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    >
                      <IconX className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Template code selector */}
            {selectedClients.length > 0 && !tiersLoading && (
              <div className="flex flex-col gap-1.5 max-w-sm pt-2 border-t">
                <Label>Template Code</Label>
                <Select value={selectedTemplateCode} onValueChange={setSelectedTemplateCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCodes.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payroll Specialist controls */}
            {selectedClients.length > 0 && selectedTemplateCode && (
              <div className="flex flex-col gap-3 pt-2 border-t">
                <div className="flex items-center justify-between max-w-sm">
                  <Label htmlFor="payroll-switch" className="text-sm">
                    Payroll Specialist
                  </Label>
                  <Switch
                    id="payroll-switch"
                    checked={payrollEnabled}
                    onCheckedChange={setPayrollEnabled}
                  />
                </div>
                {payrollEnabled && (
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <Label htmlFor="payroll-fee">Fee Amount</Label>
                    <Input
                      id="payroll-fee"
                      type="number"
                      value={payrollSpecialistFee}
                      onChange={(e) => setPayrollSpecialistFee(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {displayResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Selected Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedClients.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(displayResult.totalEmployees)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{displayResult.allocations.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-primary/70 uppercase tracking-wider">
                  Grand Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  Rp {fmt(displayResult.grandTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seq</TableHead>
                      <TableHead>Tier Name</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayResult.allocations.map((a) => (
                      <TableRow key={a.tier.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.tier.sequence}
                        </TableCell>
                        <TableCell className="font-medium">{a.tier.tier_name}</TableCell>
                        <TableCell className="text-sm">
                          {a.tier.from} - {a.tier.to}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {a.tier.pricing_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {a.tier.pricing_type === "FIXED"
                            ? `Rp ${fmt(a.tier.amount)}`
                            : `Rp ${fmt(a.tier.amount)}/emp`}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            value={Object.prototype.hasOwnProperty.call(editedEmployees, a.tier.id)
                              ? editedEmployees[a.tier.id]
                              : a.allocatedEmployees}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v === "" || Number(v) < 0) {
                                setEditedEmployees((prev) => {
                                  const next = { ...prev }
                                  delete next[a.tier.id]
                                  return next
                                })
                              } else {
                                setEditedEmployees((prev) => ({ ...prev, [a.tier.id]: Number(v) }))
                              }
                            }}
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-mono text-right font-semibold">
                          Rp {fmt(a.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Grand Total Row */}
                    <TableRow className="border-t-2 bg-muted/30">
                      <TableCell colSpan={6} className="text-right font-semibold text-sm">
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm font-mono">
                        Rp {fmt(displayResult.grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Service Fees per Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Fees per Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead className="text-right">Service Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClients.map((client) => {
                      const share = totalEmployee > 0
                        ? ((client.total_employee / totalEmployee) * 100)
                        : 0
                      const fee = totalEmployee > 0
                        ? (client.total_employee / totalEmployee) * displayResult.grandTotal
                        : 0
                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{client.klola_id}</code>
                          </TableCell>
                          <TableCell className="text-sm">{fmt(client.total_employee)}</TableCell>
                          <TableCell className="text-sm">{share.toFixed(1)}%</TableCell>
                          <TableCell className="text-sm font-mono text-right font-semibold">
                            Rp {fmt(Math.round(fee))}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Total Row */}
                    <TableRow className="border-t-2 bg-muted/30">
                      <TableCell className="font-semibold text-sm">Total</TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(totalEmployee)}</TableCell>
                      <TableCell className="text-sm font-semibold">100%</TableCell>
                      <TableCell className="text-right font-bold text-sm font-mono">
                        Rp {fmt(displayResult.grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Before VAT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Before VAT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Total Employee</TableHead>
                      <TableHead>Service Fee</TableHead>
                      <TableHead>Payroll Specialist</TableHead>
                      <TableHead className="text-right">Grand Total Before VAT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClients.map((client) => {
                      const share = totalEmployee > 0
                        ? (client.total_employee / totalEmployee)
                        : 0
                      const serviceFee = Math.round(share * displayResult.grandTotal)
                      const defaultSpFee = payrollEnabled ? payrollSpecialistFee : 0
                      const hasOverride = Object.prototype.hasOwnProperty.call(editedPayrollSpecialist, client.id)
                      const spFee = hasOverride ? editedPayrollSpecialist[client.id] : defaultSpFee
                      const beforeVat = serviceFee + spFee
                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{client.klola_id}</code>
                          </TableCell>
                          <TableCell className="text-sm">{fmt(client.total_employee)}</TableCell>
                          <TableCell className="text-sm font-mono">
                            Rp {fmt(serviceFee)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Input
                              type="number"
                              className="w-28 h-7 text-xs font-mono"
                              value={hasOverride ? editedPayrollSpecialist[client.id] : defaultSpFee}
                              onChange={(e) => {
                                const v = e.target.value
                                if (v === "" || Number(v) < 0) {
                                  setEditedPayrollSpecialist((prev) => {
                                    const next = { ...prev }
                                    delete next[client.id]
                                    return next
                                  })
                                } else {
                                  setEditedPayrollSpecialist((prev) => ({ ...prev, [client.id]: Number(v) }))
                                }
                              }}
                              min={0}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-mono text-right font-semibold">
                            Rp {fmt(beforeVat)}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Total Row */}
                    <TableRow className="border-t-2 bg-muted/30">
                      <TableCell className="font-semibold text-sm">Total</TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(totalEmployee)}</TableCell>
                      <TableCell className="text-sm font-mono font-semibold">
                        Rp {fmt(displayResult.grandTotal)}
                      </TableCell>
                      <TableCell className="text-sm font-mono font-semibold">
                        {(() => {
                          const totalSp = selectedClients.reduce((sum, c) => {
                            const has = Object.prototype.hasOwnProperty.call(editedPayrollSpecialist, c.id)
                            return sum + (has ? editedPayrollSpecialist[c.id] : (payrollEnabled ? payrollSpecialistFee : 0))
                          }, 0)
                          return totalSp > 0 ? `Rp ${fmt(totalSp)}` : "--"
                        })()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm font-mono">
                        {(() => {
                          const grandBeforeVat = selectedClients.reduce((sum, c) => {
                            const share = totalEmployee > 0 ? (c.total_employee / totalEmployee) : 0
                            const sf = Math.round(share * displayResult.grandTotal)
                            const has = Object.prototype.hasOwnProperty.call(editedPayrollSpecialist, c.id)
                            const sp = has ? editedPayrollSpecialist[c.id] : (payrollEnabled ? payrollSpecialistFee : 0)
                            return sum + sf + sp
                          }, 0)
                          return `Rp ${fmt(grandBeforeVat)}`
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </>
      )}

      {/* Empty — no client selected yet */}
      {selectedClientIds.length === 0 && !tiersLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/50">
            <IconCalculator className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-lg font-medium text-muted-foreground">
              Select clients to calculate
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-xs">
              Choose one or more clients from the dropdown above to see tier pricing breakdown.
            </p>
          </div>
        </div>
      )}

      {/* Clients selected but no template chosen */}
      {selectedClientIds.length > 0 && !selectedTemplateCode && !tiersLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/50">
            <IconCalculator className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-lg font-medium text-muted-foreground">
              Select a template code
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-xs">
              Choose a template code to see tier pricing breakdown for the selected clients.
            </p>
          </div>
        </div>
      )}

      {/* Tiers loading */}
      {tiersLoading && selectedClientIds.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Tier Settings — Table Skeleton
// ===========================================================================

function TierRateTableSkeleton({ rows = 5 }: { rows?: number }) {
  const headers = ["Seq", "Tier Name", "Template", "From - To", "Pricing", "Amount", "Status", "Effective", "Actions"]

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
              <TableCell><Skeleton className="h-5 w-8" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
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

// ===========================================================================
// Tier Settings — Detail Sheet
// ===========================================================================

function TierRateDetailSheet({
  data, loading, open, onOpenChange,
}: {
  data: TierRate | null; loading: boolean; open: boolean; onOpenChange: (v: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Tier Rate Detail</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        {loading || !data ? (
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
                <IconCash className="size-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold">{data.tier_name}</h3>
              </div>
              <Badge variant={data.is_active ? "default" : "secondary"}>
                {data.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Info</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Tier Name" value={data.tier_name} />
                <DetailRow label="Template Code" value={data.template_code} />
                <DetailRow label="Sequence" value={String(data.sequence)} />
                <DetailRow label="From" value={String(data.from)} />
                <DetailRow label="To" value={String(data.to)} />
                <DetailRow label="Pricing Type" value={data.pricing_type} />
                <DetailRow label="Amount" value={String(data.amount)} />
                <DetailRow label="Active" value={data.is_active ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Effective Period</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="From" value={formatDateOnly(data.effective_from)} />
                <DetailRow label="Until" value={formatDateOnly(data.effective_until)} />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">Timestamps</p>
              <div className="px-4 pb-1.5">
                <DetailRow label="Created" value={formatDateTime(data.created_at)} />
                <DetailRow label="Updated" value={data.updated_at ? formatDateTime(data.updated_at) : "--"} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ===========================================================================
// Tier Settings — Create / Edit Dialog
// ===========================================================================

const emptyTierForm: TierRateFormData = {
  updated_by: "", tier_name: "", template_code: "", sequence: 0, from: 0, to: 0,
  pricing_type: "FIXED", amount: 0,
  effective_from: "", effective_until: "",
  is_active: true,
}

function TierRateFormDialog({
  open, onOpenChange, initial, onSave, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  initial: TierRateFormData | null; onSave: (data: TierRateFormData) => Promise<boolean>; loading: boolean
}) {
  const updatedBy = useClientFormDefaults()
  const [form, setForm] = useState<TierRateFormData>(emptyTierForm)

  useEffect(() => {
    setForm(initial ?? emptyTierForm)
  }, [initial, open])

  useEffect(() => {
    setForm((p) => ({ ...p, updated_by: updatedBy }))
  }, [updatedBy])

  function update<K extends keyof TierRateFormData>(k: K, v: TierRateFormData[K]) {
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
            <DialogTitle>{isEdit ? "Edit Tier Rate" : "Create Tier Rate"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tr-updated-by">Updated By</Label>
              <Input id="tr-updated-by" value={form.updated_by} disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tr-tier-name">Tier Name</Label>
              <Input
                id="tr-tier-name"
                value={form.tier_name}
                onChange={(e) => update("tier_name", e.target.value)}
                placeholder="e.g. Tier 1"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tr-template-code">Template Code</Label>
              <Input
                id="tr-template-code"
                value={form.template_code}
                onChange={(e) => update("template_code", e.target.value)}
                placeholder="e.g. DEFAULT"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr-sequence">Sequence</Label>
                <Input
                  id="tr-sequence"
                  type="number"
                  value={form.sequence}
                  onChange={(e) => update("sequence", Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr-from">From</Label>
                <Input
                  id="tr-from"
                  type="number"
                  value={form.from}
                  onChange={(e) => update("from", Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr-to">To</Label>
                <Input
                  id="tr-to"
                  type="number"
                  value={form.to}
                  onChange={(e) => update("to", Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr-pricing-type">Pricing Type</Label>
                <Select value={form.pricing_type} onValueChange={(v) => update("pricing_type", v)}>
                  <SelectTrigger id="tr-pricing-type">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>{pt.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr-amount">Amount</Label>
                <Input
                  id="tr-amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => update("amount", Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Effective From</Label>
                <DatePickerPopover
                  value={form.effective_from}
                  onChange={(v) => update("effective_from", v)}
                  placeholder="Pick a date"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Effective Until</Label>
                <DatePickerPopover
                  value={form.effective_until}
                  onChange={(v) => update("effective_until", v)}
                  placeholder="Pick a date"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tr-active">Active</Label>
              <Switch
                id="tr-active"
                checked={form.is_active}
                onCheckedChange={(v) => update("is_active", v)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.tier_name.trim() || !form.template_code.trim()}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// Tier Settings — Content
// ===========================================================================

function TierSettingsContent() {
  const { data: rates, loading, error, refetch } = useTierRates()
  const { data: detailData, loading: detailLoading, fetchDetail } = useTierRateDetail()
  const { loading: creating, create } = useCreateTierRate()
  const { loading: updating, update } = useUpdateTierRate()
  const { loading: deleting, remove } = useDeleteTierRate()
  const updatedBy = useClientFormDefaults()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedRate, setSelectedRate] = useState<TierRate | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<TierRate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TierRate | null>(null)

  function handleView(rate: TierRate) {
    setSelectedRate(rate)
    setSheetOpen(true)
    fetchDetail(rate.id)
  }

  function handleCreate() {
    setEditingRate(null)
    setFormOpen(true)
  }

  function handleEdit(rate: TierRate) {
    setEditingRate(rate)
    setFormOpen(true)
  }

  async function handleSave(data: TierRateFormData): Promise<boolean> {
    const payload = { ...data, updated_by: updatedBy || data.updated_by }
    if (editingRate) {
      const { ok, message } = await update(editingRate.id, payload)
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
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={handleCreate}>
          <IconPlus className="size-4" />
          <span className="ml-1.5">New Tier Rate</span>
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

      {loading && <TierRateTableSkeleton />}

      {!loading && !error && rates.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No tier rates found</p>
        </div>
      )}

      {!loading && !error && rates.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seq</TableHead>
                <TableHead>Tier Name</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>From - To</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id} className="cursor-pointer" onClick={() => handleView(rate)}>
                  <TableCell className="text-sm text-muted-foreground">{rate.sequence}</TableCell>
                  <TableCell className="font-medium">{rate.tier_name}</TableCell>
                  <TableCell className="text-sm">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{rate.template_code}</code>
                  </TableCell>
                  <TableCell className="text-sm">{rate.from} - {rate.to}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {rate.pricing_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{rate.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={rate.is_active ? "default" : "secondary"}>
                      {rate.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateOnly(rate.effective_from)} -- {formatDateOnly(rate.effective_until)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(rate) }}>
                        <IconPencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(rate) }}>
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

      <TierRateDetailSheet data={detailData ?? selectedRate} loading={detailLoading} open={sheetOpen} onOpenChange={setSheetOpen} />

      <TierRateFormDialog
        open={formOpen} onOpenChange={setFormOpen}
        initial={editingRate ? {
          updated_by: updatedBy, tier_name: editingRate.tier_name,
          template_code: editingRate.template_code,
          sequence: editingRate.sequence, from: editingRate.from, to: editingRate.to,
          pricing_type: editingRate.pricing_type, amount: editingRate.amount,
          effective_from: editingRate.effective_from, effective_until: editingRate.effective_until,
          is_active: editingRate.is_active,
        } : null}
        onSave={handleSave} loading={creating || updating}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tier Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.tier_name}</strong>?
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
// InvoiceCalculatorContent
// ---------------------------------------------------------------------------

function InvoiceCalculatorContent() {
  return (
    <>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Apps</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Invoice Calculator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tabs defaultValue="tier-pricing">
          <TabsList>
            <TabsTrigger value="tier-pricing" className="gap-1.5">
              <IconCash className="size-4" />
              Tier Pricing
            </TabsTrigger>
            <TabsTrigger value="tier-settings" className="gap-1.5">
              <IconCash className="size-4" />
              Tier Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tier-pricing" className="flex flex-col gap-4 mt-4">
            <TierCalculatorContent />
          </TabsContent>

          <TabsContent value="tier-settings" className="flex flex-col gap-4 mt-4">
            <TierSettingsContent />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function InvoiceCalculatorPage() {
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
          <InvoiceCalculatorContent />
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
