"use client"

import * as React from "react"
import {
  Home,
  ScrollText,
  Sword,
  Scroll,
  BookOpen,
  Wand2,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

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

// Navigation menu structure (isActive will be set dynamically)
const navMenuStructure = [
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: Home,
  },
  {
    title: "Campaigns",
    url: "/app/campaigns",
    icon: Scroll,
  },
  {
    title: "Sessions",
    url: "/app/sessions",
    icon: ScrollText,
  },
  {
    title: "Notes & Lorebook",
    url: "/app/notes",
    icon: BookOpen,
    items: [
      {
        title: "All Notes",
        url: "/app/notes",
      },
      {
        title: "Lorebook",
        url: "/app/notes/lorebook",
      },
      {
        title: "New Note",
        url: "/app/notes/new",
      },
    ],
  },
  {
    title: "World Building",
    url: "/app/world",
    icon: Sparkles,
    items: [
      {
        title: "NPCs",
        url: "/app/world/npcs",
      },
      {
        title: "Locations",
        url: "/app/world/locations",
      },
      {
        title: "Points of Interest",
        url: "/app/world/pois",
      },
      {
        title: "Items & Loot",
        url: "/app/world/items",
      },
    ],
  },
  {
    title: "Tools",
    url: "/app/tools",
    icon: Wand2,
    items: [
      {
        title: "Dice Roller",
        url: "/app/tools/dice",
      },
      {
        title: "NPC Generator",
        url: "/app/tools/npc-generator",
      },
      {
        title: "Location Generator",
        url: "/app/tools/location-generator",
      },
      {
        title: "Loot Generator",
        url: "/app/tools/loot-generator",
      },
    ],
  },
]

const campaigns = [
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
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  // Add isActive based on current pathname
  const navMainWithActive = navMenuStructure.map(item => {
    // Check if current path matches this item's URL
    const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')

    // For items with sub-items, check if any sub-item matches
    const hasActiveChild = item.items?.some(subItem => pathname === subItem.url)

    return {
      ...item,
      isActive: isActive || hasActiveChild,
    }
  })

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
        <NavMain items={navMainWithActive} />
        <NavCampaigns campaigns={campaigns} />
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarCalendar /> */}
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
