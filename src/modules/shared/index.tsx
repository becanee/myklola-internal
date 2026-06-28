"use client"

import { IconSparkles, IconLayoutDashboard } from "@tabler/icons-react"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { type AppMode, MODE_META } from "./_logic"
import { UserButton } from "@clerk/nextjs"

const MODE_ICON: Record<AppMode, typeof IconSparkles> = {
  ai: IconSparkles,
  dashboard: IconLayoutDashboard,
}

function ModeSwitcher({
  active,
  onChange,
}: {
  active: AppMode
  onChange: (mode: AppMode) => void
}) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <div
      className={cn(
        "flex rounded-xl bg-muted p-0.5 w-full",
        collapsed ? "flex-col p-1 gap-0.5" : "flex-row gap-0.5"
      )}
    >
      {MODE_META.map((mode) => {
        const isActive = active === mode.id
        const Icon = MODE_ICON[mode.id]

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed
                ? "justify-center px-1.5 flex-1"
                : "flex-1 justify-center",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{mode.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="md:hidden" />
        {children}
      </div>
      <div className="flex px-4 gap-2 items-center">
        <UserButton />
        <AnimatedThemeToggler />
      </div>
    </header>
  )
}

export { ModeSwitcher, type AppMode }