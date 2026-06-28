"use client"

import {
    Collapsible
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface NavMainItem {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
    isActive?: boolean
    items?: { title: string; url: string }[]
}

export function NavClient({ items }: { items: NavMainItem[] }) {
    const pathname = usePathname()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>CLIENTS</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                                    <Link href={item.url}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}