"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { getUserCampaigns, getCampaignSessions } from "@/lib/firestore"
import type { Campaign, Session, Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Plus, User, LogOut, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignSessions, setCampaignSessions] = useState<Record<string, Session[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure auth state is fully established
      const timer = setTimeout(() => {
        loadCampaigns()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user])

  const loadCampaigns = async () => {
    if (!user) {
      console.log("[v0] No user found, cannot load campaigns")
      return
    }
    
    // Double-check authentication state
    const { auth } = await import("@/lib/firebase")
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== user.uid) {
      console.error("[v0] Authentication state mismatch:", {
        hookUser: user.uid,
        currentUser: currentUser?.uid,
        isAuthenticated: !!currentUser
      })
      return
    }
    
    try {
      console.log("[v0] Loading campaigns for user:", user.uid)
      console.log("[v0] User object:", user)
      console.log("[v0] User email:", user.email)
      console.log("[v0] User emailVerified:", user.emailVerified)
      console.log("[v0] Auth token available:", !!currentUser.accessToken)
      const userCampaigns = await getUserCampaigns(user.uid)
      console.log("[v0] Loaded campaigns:", userCampaigns.length)
      console.log("[v0] Campaigns data:", userCampaigns)
      setCampaigns(userCampaigns)

      const sessionsMap: Record<string, Session[]> = {}
      for (const campaign of userCampaigns) {
        if (campaign.id) {
          console.log("[v0] Loading sessions for campaign:", campaign.id)
          const sessions = await getCampaignSessions(user.uid, campaign.id)
          console.log("[v0] Loaded sessions for campaign:", campaign.id, sessions.length)
          sessionsMap[campaign.id] = sessions
        }
      }
      setCampaignSessions(sessionsMap)
    } catch (error) {
      console.error("[v0] Error loading campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/auth")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (session: Session) => {
    if (session.summaryStatus === "completed") {
      return <Badge className="bg-[#22C55E] text-white hover:bg-[#22C55E]/90">Summary Ready</Badge>
    }
    if (session.transcriptStatus === "completed") {
      return <Badge className="bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90">Transcript Ready</Badge>
    }
    if (session.transcriptStatus === "pending") {
      return <Badge className="bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90">Processing</Badge>
    }
    if (session.audioFilePath) {
      return <Badge className="bg-[#EEA232] text-white hover:bg-[#EEA232]/90">Recorded</Badge>
    }
    return <Badge className="bg-[#A3A3A3] text-white hover:bg-[#A3A3A3]/90">Draft</Badge>
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getGuestPlayers = (campaignId: string): Player[] => {
    const sessions = campaignSessions[campaignId] || []
    const guestMap = new Map<string, Player>()

    sessions.forEach((session) => {
      if (session.sessionPlayers) {
        session.sessionPlayers.forEach((player) => {
          guestMap.set(player.playerName, player)
        })
      }
    })

    return Array.from(guestMap.values())
  }

  return (
    <div className="min-h-screen bg-[#101010]">
      {/* Header */}
      <header className="border-b border-[#A3A3A3]/20 bg-[#1D1D1D]">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#F94933]">Dungeon Diary</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10 bg-[#F94933]">
                  <AvatarFallback className="bg-[#F94933] text-white">
                    {user?.email?.[0].toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1D1D1D] border-[#A3A3A3]/20">
              <DropdownMenuLabel className="text-[#EDEDEE]">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#A3A3A3]/20" />
              <DropdownMenuItem asChild className="text-[#EDEDEE] focus:bg-[#101010] focus:text-[#EDEDEE]">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[#EF4444] focus:bg-[#101010] focus:text-[#EF4444]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#EDEDEE]">Your Campaigns</h2>
            <p className="mt-1 text-[#A3A3A3]">Manage your adventures and sessions</p>
          </div>
          <Button asChild className="bg-[#F94933] hover:bg-[#F94933]/90 text-white">
            <Link href="/app/campaigns/new" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Campaign
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#A3A3A3]">Loading campaigns...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-[#A3A3A3] mb-4">No campaigns yet. Start your first adventure!</p>
              <Button asChild className="bg-[#F94933] hover:bg-[#F94933]/90 text-white">
                <Link href="/app/campaigns/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {campaigns.map((campaign) => {
              const sessions = campaignSessions[campaign.id!] || []
              const guestPlayers = getGuestPlayers(campaign.id!)

              return (
                <Card key={campaign.id} className="bg-[#1D1D1D] border-[#A3A3A3]/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-[#EDEDEE] text-xl">{campaign.name}</CardTitle>
                        <CardDescription className="text-[#A3A3A3] mt-1">
                          DM: {campaign.dm} • {campaign.players.length} players
                        </CardDescription>
                        {campaign.description && <p className="text-[#A3A3A3] text-sm mt-2">{campaign.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-[#A3A3A3]/30 text-[#EDEDEE] hover:bg-[#101010] bg-transparent"
                        >
                          <Link href={`/app/campaigns/${campaign.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-[#F94933] hover:bg-[#F94933]/90 text-white">
                          <Link href={`/app/new?campaignId=${campaign.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-[#A3A3A3] text-xs mb-1">Campaign Players</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.players.map((player, idx) => (
                          <Badge key={idx} variant="outline" className="border-[#EEA232] text-[#EEA232]">
                            {player.characterName
                              ? `${player.playerName} (${player.characterName})`
                              : player.playerName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {guestPlayers.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[#A3A3A3] text-xs mb-1">Guest Appearances</p>
                        <div className="flex flex-wrap gap-1">
                          {guestPlayers.map((player, idx) => (
                            <Badge key={idx} variant="outline" className="border-[#8B5CF6] text-[#8B5CF6]">
                              {player.characterName
                                ? `${player.playerName} (${player.characterName})`
                                : player.playerName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <p className="text-[#A3A3A3] text-sm">No sessions yet</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[#EDEDEE] text-sm font-medium mb-2">Sessions ({sessions.length})</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {sessions.map((session) => (
                            <Link key={session.id} href={`/app/session/${session.id}`}>
                              <div className="bg-[#101010] border border-[#A3A3A3]/20 rounded-lg p-3 hover:border-[#F94933]/50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[#EDEDEE] text-sm font-medium line-clamp-1">{session.title}</p>
                                  {getStatusBadge(session)}
                                </div>
                                <p className="text-[#A3A3A3] text-xs mt-1">{formatDate(session.createdAt)}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button asChild size="lg" className="h-14 w-14 rounded-full bg-[#F94933] hover:bg-[#F94933]/90 shadow-lg">
          <Link href="/app/campaigns/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
