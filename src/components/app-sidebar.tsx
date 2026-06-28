"use client"

import { NavMain } from "@/components/nav-main"
import { NavSettings } from "@/components/nav-settings"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ModeSwitcher, type AppMode } from "@/modules/shared"
import {
  IconBell,
  IconBrain,
  IconBuildings,
  IconChartPie,
  IconCreditCard,
  IconFileText,
  IconFrame,
  IconLayoutDashboard,
  IconLayoutSidebar,
  IconLogout,
  IconMap,
  IconRosetteDiscountCheck,
  IconSelector,
  IconShield,
  IconSparkles,
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
// NavUser — global user menu
// ---------------------------------------------------------------------------

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <IconSelector className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconSparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconRosetteDiscountCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconBell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
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
