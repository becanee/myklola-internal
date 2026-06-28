"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ChatContent, ChatSidebar } from "@/modules/ai"
import { type AppMode, PageHeader } from "@/modules/shared"
import { useState } from "react"

function DashboardContent() {
  return (
    <>
      <PageHeader>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">
                <BreadcrumbPage>Apps</BreadcrumbPage>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  )
}

export function DashboardPage() {
  const [mode, setMode] = useState<AppMode>("dashboard")

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar onModeChange={setMode} />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <DashboardContent /> : <ChatContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}
