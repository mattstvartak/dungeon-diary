"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { createSession, getUserCampaigns, getCampaign } from "@/lib/firestore"
import type { Campaign, Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

function NewSessionContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [guestPlayers, setGuestPlayers] = useState<Player[]>([])
  const [newGuestPlayerName, setNewGuestPlayerName] = useState("")
  const [newGuestCharacterName, setNewGuestCharacterName] = useState("")
  const [absentPlayers, setAbsentPlayers] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  useEffect(() => {
    const campaignId = searchParams.get("campaignId")
    if (campaignId) {
      setSelectedCampaignId(campaignId)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCampaignId && user) {
      loadCampaignDetails(selectedCampaignId)
      setAbsentPlayers([])
    }
  }, [selectedCampaignId, user])

  const loadCampaigns = async () => {
    if (!user) return
    try {
      const userCampaigns = await getUserCampaigns(user.uid)
      setCampaigns(userCampaigns)
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      })
    }
  }

  const loadCampaignDetails = async (campaignId: string) => {
    if (!user) return
    try {
      const campaign = await getCampaign(user.uid, campaignId)
      setSelectedCampaign(campaign)
    } catch (error) {
      console.error("Error loading campaign:", error)
    }
  }

  const addGuestPlayer = () => {
    if (!newGuestPlayerName.trim()) {
      toast({
        title: "Player name required",
        description: "Please enter a player name",
        variant: "destructive",
      })
      return
    }

    const playerExists = guestPlayers.some((p) => p.playerName === newGuestPlayerName.trim())
    if (playerExists) {
      toast({
        title: "Player already added",
        description: "This player is already in the guest list",
        variant: "destructive",
      })
      return
    }

    setGuestPlayers([
      ...guestPlayers,
      {
        playerName: newGuestPlayerName.trim(),
        characterName: newGuestCharacterName.trim() || undefined,
      },
    ])
    setNewGuestPlayerName("")
    setNewGuestCharacterName("")
  }

  const removeGuestPlayer = (playerName: string) => {
    setGuestPlayers(guestPlayers.filter((p) => p.playerName !== playerName))
  }

  const handleGuestPlayerKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addGuestPlayer()
    }
  }

  const toggleCampaignPlayer = (playerName: string) => {
    setAbsentPlayers((prev) => {
      if (prev.includes(playerName)) {
        return prev.filter((name) => name !== playerName)
      } else {
        return [...prev, playerName]
      }
    })
  }

  const handleCreateSession = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a session title",
        variant: "destructive",
      })
      return
    }

    if (!selectedCampaignId) {
      toast({
        title: "Campaign required",
        description: "Please select a campaign",
        variant: "destructive",
      })
      return
    }

    if (!user) return

    setIsCreating(true)
    try {
      const sessionData: any = {
        userId: user.uid,
        campaignId: selectedCampaignId,
        title: title.trim(),
        players: selectedCampaign?.players,
        transcriptStatus: "none",
        summaryStatus: "none",
        status: "draft",
      }

      // Only add sessionPlayers if there are guest players
      if (guestPlayers.length > 0) {
        sessionData.sessionPlayers = guestPlayers
      }

      // Only add absentPlayers if there are absent players
      if (absentPlayers.length > 0) {
        sessionData.absentPlayers = absentPlayers
      }

      const newSessionId = await createSession(sessionData)

      toast({
        title: "Session created",
        description: "Your session has been created successfully",
      })

      // Navigate to the session detail page
      router.push(`/app/session/${newSessionId}`)
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      })
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#101010]">
      {/* Header */}
      <header className="border-b border-[#A3A3A3]/20 bg-[#1D1D1D]">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button asChild variant="ghost" size="icon" className="text-[#EDEDEE] hover:bg-[#101010]">
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-[#F94933]">New Session</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <CardHeader>
            <CardTitle className="text-[#EDEDEE]">Session Details</CardTitle>
            <CardDescription className="text-[#A3A3A3]">Set up your new session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaign" className="text-[#EDEDEE]">
                Campaign <span className="text-[#F94933]">*</span>
              </Label>
              {campaigns.length === 0 ? (
                <div className="text-[#A3A3A3] text-sm">
                  No campaigns found.{" "}
                  <Link href="/app/campaigns/new" className="text-[#F94933] hover:underline">
                    Create one first
                  </Link>
                </div>
              ) : (
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId} disabled={isCreating}>
                  <SelectTrigger className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE]">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
                    {campaigns.map((campaign) => (
                      <SelectItem
                        key={campaign.id}
                        value={campaign.id!}
                        className="text-[#EDEDEE] focus:bg-[#101010] focus:text-[#EDEDEE]"
                      >
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCampaign && (
                <div className="mt-2 p-3 bg-[#101010] rounded-lg border border-[#A3A3A3]/20">
                  <p className="text-[#EDEDEE] text-sm font-medium mb-2">{selectedCampaign.name}</p>
                  <p className="text-[#A3A3A3] text-xs mb-2">DM: {selectedCampaign.dm}</p>
                  <div className="space-y-1">
                    <p className="text-[#A3A3A3] text-xs font-medium">Campaign Players:</p>
                    <p className="text-[#A3A3A3] text-xs mb-2">Click to mark as absent</p>
                    <div className="space-y-2">
                      {selectedCampaign.players.map((player, index) => {
                        const isAbsent = absentPlayers.includes(player.playerName)
                        return (
                          <button
                            key={index}
                            onClick={() => toggleCampaignPlayer(player.playerName)}
                            disabled={isCreating}
                            className={`w-full text-left p-2 rounded border transition-all ${
                              isAbsent
                                ? "bg-[#1D1D1D]/50 border-[#A3A3A3]/20 opacity-50"
                                : "bg-[#1D1D1D] border-[#A3A3A3]/30 hover:border-[#EEA232]/50"
                            } ${isCreating ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span
                                  className={`text-sm font-medium ${isAbsent ? "text-[#A3A3A3] line-through" : "text-[#EDEDEE]"}`}
                                >
                                  {player.playerName}
                                </span>
                                {player.characterName && (
                                  <span className={`text-xs ml-2 ${isAbsent ? "text-[#A3A3A3]/70" : "text-[#A3A3A3]"}`}>
                                    ({player.characterName})
                                  </span>
                                )}
                              </div>
                              {isAbsent && (
                                <Badge variant="secondary" className="bg-[#EF4444]/20 text-[#EF4444] text-xs">
                                  Absent
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#EDEDEE]">
                Session Title <span className="text-[#F94933]">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Quest for the Dragon's Hoard"
                disabled={isCreating}
                className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3]"
              />
            </div>

            {selectedCampaign && (
              <div className="space-y-3 pt-2 border-t border-[#A3A3A3]/20">
                <div>
                  <Label className="text-[#EDEDEE]">Guest Players (Optional)</Label>
                  <p className="text-[#A3A3A3] text-xs mt-1">Add players who are only appearing in this session</p>
                </div>

                {guestPlayers.length > 0 && (
                  <div className="space-y-2">
                    {guestPlayers.map((player, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-start bg-[#101010] p-3 rounded-lg border border-[#9333EA]/30"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[#A3A3A3] text-xs mb-1">Player Name</Label>
                            <div className="text-[#EDEDEE] text-sm font-medium py-2">{player.playerName}</div>
                          </div>
                          <div>
                            <Label className="text-[#A3A3A3] text-xs mb-1">Character Name</Label>
                            <div className="text-[#EDEDEE] text-sm py-2">
                              {player.characterName || <span className="text-[#A3A3A3] italic">None</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGuestPlayer(player.playerName)}
                          disabled={isCreating}
                          className="text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444] h-9 w-9 mt-5"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#9333EA]/20">
                  <Label className="text-[#EDEDEE] text-sm">Add Guest Player</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newGuestPlayerName}
                      onChange={(e) => setNewGuestPlayerName(e.target.value)}
                      onKeyPress={handleGuestPlayerKeyPress}
                      placeholder="Player name (e.g. John Smith) *"
                      disabled={isCreating}
                      autoComplete="off"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-11 text-base"
                    />
                    <Input
                      value={newGuestCharacterName}
                      onChange={(e) => setNewGuestCharacterName(e.target.value)}
                      onKeyPress={handleGuestPlayerKeyPress}
                      placeholder="Character name (e.g. Gandalf the Grey)"
                      disabled={isCreating}
                      autoComplete="off"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-11 text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addGuestPlayer}
                    disabled={isCreating}
                    variant="outline"
                    className="w-full border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10 h-11 bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Guest Player
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#A3A3A3]/20">
              <Button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white h-14"
              >
                {isCreating ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <AuthGuard>
      <NewSessionContent />
    </AuthGuard>
  )
}
