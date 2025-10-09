"use client"

import * as React from "react"
import {
  Home,
  ScrollText,
  Settings,
  Plus,
  Sword,
  Scroll,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavCampaigns } from "@/components/nav-campaigns"
import { NavUser } from "@/components/nav-user"
import SidebarCalendar from "@/components/sidebar-calendar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { useAuth } from "@/providers/auth-provider"

// Sample data - you can replace with real data later
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/app/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Campaigns",
      url: "/app/campaigns",
      icon: Scroll,
      items: [
        {
          title: "All Campaigns",
          url: "/app/campaigns",
        },
        {
          title: "New Campaign",
          url: "/app/campaigns?new=true",
        },
      ],
    },
    {
      title: "Sessions",
      url: "/app/sessions",
      icon: ScrollText,
      items: [
        {
          title: "All Sessions",
          url: "/app/sessions",
        },
        {
          title: "Recent",
          url: "/app/sessions?filter=recent",
        },
      ],
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings,
    },
  ],
  campaigns: [
    {
      name: "Curse of Strahd",
      url: "/app/campaigns/1",
      icon: Sword,
    },
    {
      name: "Lost Mine",
      url: "/app/campaigns/2",
      icon: Sword,
    },
    {
      name: "Homebrew",
      url: "/app/campaigns/3",
      icon: Sword,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  🎲
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Dungeon Diary</span>
                  <span className="truncate text-xs">Chronicle Adventures</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavCampaigns campaigns={data.campaigns} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarCalendar />
        {user && (
          <NavUser
            user={{
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              avatar: user.user_metadata?.avatar_url,
            }}
            onLogout={handleSignOut}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
