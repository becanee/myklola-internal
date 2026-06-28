"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  IconMessage,
  IconPlus,
  IconLayoutSidebar,
} from "@tabler/icons-react"
import { ModeSwitcher, type AppMode } from "@/modules/shared"
import { chatHistory } from "@/modules/ai/_logic"

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

export function ChatSidebar({
  onModeChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onModeChange: (mode: AppMode) => void
}) {
  const [activeChat, setActiveChat] = useState<string | null>(chatHistory[0]?.id ?? null)
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="p-2">
          <ModeSwitcher active="ai" onChange={onModeChange} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-2">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn(
              "justify-start gap-2.5 rounded-lg transition-all duration-200",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              "hover:bg-sidebar-accent",
              collapsed ? "size-8 justify-center p-0" : "w-full px-3 py-2"
            )}
          >
            <IconPlus className="size-4 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium truncate">New chat</span>
            )}
          </Button>
        </div>

        <SidebarMenu className="mt-2 px-2">
          {chatHistory.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                isActive={activeChat === chat.id}
                onClick={() => setActiveChat(chat.id)}
                tooltip={chat.title}
              >
                <IconMessage className="size-4 shrink-0" />
                <span className="truncate">{chat.title}</span>
                {!collapsed && (
                  <span className="ml-auto shrink-0 text-xs text-sidebar-foreground/50">
                    {chat.date}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <CollapseButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
