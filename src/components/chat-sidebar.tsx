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
  IconTrash,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { ModeSwitcher, type AppMode } from "@/modules/shared"
import type { Conversation } from "@/modules/ai/_logic"

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
// ChatSidebar
// ---------------------------------------------------------------------------

export function ChatSidebar({
  onModeChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onModeChange: (mode: AppMode) => void
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => string
  onDeleteConversation?: (id: string) => void
}) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Sorted by updatedAt descending
  const sorted = [...conversations].sort(
    (a, b) => b.updatedAt - a.updatedAt
  )

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    // If deleting the active conversation, create a new one
    if (id === activeConversationId && conversations.length <= 1) {
      onDeleteConversation?.(id)
      onNewChat()
    } else {
      onDeleteConversation?.(id)
    }
  }

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
            onClick={() => onNewChat()}
          >
            <IconPlus className="size-4 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium truncate">New chat</span>
            )}
          </Button>
        </div>

        <SidebarMenu className="mt-2 px-2">
          {sorted.map((conv) => (
            <SidebarMenuItem
              key={conv.id}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <SidebarMenuButton
                isActive={activeConversationId === conv.id}
                onClick={() => onSelectConversation(conv.id)}
                tooltip={conv.title}
                className="group/chat-item"
              >
                <IconMessage className="size-4 shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                {!collapsed && hoveredId === conv.id ? (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="ml-auto shrink-0 p-0.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-destructive transition-colors"
                    title="Delete chat"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                ) : !collapsed ? (
                  <span className="ml-auto shrink-0 text-[10px] text-sidebar-foreground/40">
                    {formatDistanceToNow(conv.updatedAt, { addSuffix: true })}
                  </span>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {sorted.length === 0 && !collapsed && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">
              No conversations yet
            </p>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <CollapseButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
