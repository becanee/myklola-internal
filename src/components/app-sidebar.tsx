"use client"

import { NavMain } from "@/components/nav-main"
import { NavSettings } from "@/components/nav-settings"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ModeSwitcher, type AppMode } from "@/modules/shared"
import {
  IconBrain,
  IconBuildings,
  IconChartPie,
  IconFileText,
  IconFrame,
  IconLayoutDashboard,
  IconLayoutSidebar,
  IconMap,
  IconShield,
  IconUsers
} from "@tabler/icons-react"
import * as React from "react"
import { NavClient } from "./nav-client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconLayoutDashboard,
      isActive: true,
    },
  ],
  navClient: [
    {
      title: "Datas",
      url: "/client/datas",
      icon: IconBuildings,
    },
    {
      title: "Models",
      url: "/client/models",
      icon: IconBrain,
    },
    {
      title: "Request Logs",
      url: "/client/request-logs",
      icon: IconFileText,
    },
  ],
  navSettings: [
    {
      title: "Users",
      url: "/settings/users",
      icon: IconUsers,
    },
    {
      title: "Roles",
      url: "/settings/roles",
      icon: IconShield,
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: IconFrame },
    { name: "Sales & Marketing", url: "#", icon: IconChartPie },
    { name: "Travel", url: "#", icon: IconMap },
  ],
}

// ---------------------------------------------------------------------------
// CollapseButton
// ---------------------------------------------------------------------------

function CollapseButton() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      className={cn(
        "justify-start gap-2.5 rounded-lg transition-all duration-200",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground",
        "hover:bg-sidebar-accent",
        collapsed ? "size-8 justify-center p-0" : "w-full px-3 py-2"
      )}
      onClick={() => toggleSidebar()}
    >
      <IconLayoutSidebar className="size-4 shrink-0 transition-transform duration-200" />
      {!collapsed && (
        <span className="text-sm font-medium truncate">Collapse</span>
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// AppSidebar — self-contained
// ---------------------------------------------------------------------------

export function AppSidebar({
  mode,
  onModeChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="p-2">
          <ModeSwitcher active={mode} onChange={onModeChange} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavClient items={sidebarData.navClient} />
        <NavSettings items={sidebarData.navSettings} />
        {/* <NavProjects projects={sidebarData.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <CollapseButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
