"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { getCampaign, updateCampaign, getCampaignSessions } from "@/lib/firestore"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, X, Plus, Lock } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

function EditCampaignContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const campaignId = params.id as string

  const [name, setName] = useState("")
  const [dm, setDm] = useState("")
  const [description, setDescription] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newCharacterName, setNewCharacterName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasExistingSessions, setHasExistingSessions] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaign()
    }
  }, [user, campaignId])

  const loadCampaign = async () => {
    if (!user) return
    try {
      const campaign = await getCampaign(user.uid, campaignId)
      if (!campaign) {
        toast({
          title: "Campaign not found",
          description: "The campaign you're looking for doesn't exist",
          variant: "destructive",
        })
        router.push("/app")
        return
      }

      if (campaign.userId !== user?.uid) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to edit this campaign",
          variant: "destructive",
        })
        router.push("/app")
        return
      }

      setName(campaign.name)
      setDm(campaign.dm)
      setDescription(campaign.description || "")
      setPlayers(campaign.players)

      const sessions = await getCampaignSessions(user.uid, campaignId)
      setHasExistingSessions(sessions.length > 0)
    } catch (error) {
      console.error("[v0] Error loading campaign:", error)
      toast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const playerExists = players.some((p) => p.playerName === newPlayerName.trim())
      if (playerExists) {
        toast({
          title: "Player exists",
          description: "This player is already in the campaign",
          variant: "destructive",
        })
        return
      }

      setPlayers([
        ...players,
        {
          playerName: newPlayerName.trim(),
          characterName: newCharacterName.trim() || undefined,
        },
      ])
      setNewPlayerName("")
      setNewCharacterName("")
    }
  }

  const removePlayer = (playerName: string) => {
    setPlayers(players.filter((p) => p.playerName !== playerName))
  }

  const updatePlayerName = (oldPlayerName: string, newPlayerName: string) => {
    if (hasExistingSessions) return // Names are locked after first session

    setPlayers(players.map((p) => (p.playerName === oldPlayerName ? { ...p, playerName: newPlayerName } : p)))
  }

  const updatePlayerCharacter = (playerName: string, characterName: string) => {
    if (hasExistingSessions) return // Character names are locked after first session

    setPlayers(
      players.map((p) => (p.playerName === playerName ? { ...p, characterName: characterName || undefined } : p)),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent, field: "player" | "character") => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (field === "character" || newPlayerName.trim()) {
        addPlayer()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a campaign name",
        variant: "destructive",
      })
      return
    }

    if (!dm.trim()) {
      toast({
        title: "DM required",
        description: "Please enter the Dungeon Master's name",
        variant: "destructive",
      })
      return
    }

    if (players.length === 0) {
      toast({
        title: "Players required",
        description: "Please add at least one player",
        variant: "destructive",
      })
      return
    }

    if (!user) return
    setIsSubmitting(true)

    try {
      const trimmedPlayers = players.map((p) => ({
        playerName: p.playerName.trim(),
        characterName: p.characterName?.trim() || undefined,
      }))

      await updateCampaign(user.uid, campaignId, {
        name: name.trim(),
        dm: dm.trim(),
        players: trimmedPlayers,
        description: description.trim() || undefined,
      })

      toast({
        title: "Campaign updated",
        description: "Your campaign has been updated successfully",
      })

      router.push("/app")
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="text-[#A3A3A3]">Loading campaign...</div>
      </div>
    )
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
          <h1 className="text-xl font-bold text-[#F94933]">Edit Campaign</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
            <CardHeader>
              <CardTitle className="text-[#EDEDEE]">Campaign Details</CardTitle>
              <CardDescription className="text-[#A3A3A3]">Update your campaign information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#EDEDEE]">
                  Campaign Name <span className="text-[#F94933]">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The Lost Mines of Phandelver"
                  autoComplete="off"
                  className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-12 text-base"
                />
              </div>

              {/* Dungeon Master */}
              <div className="space-y-2">
                <Label htmlFor="dm" className="text-[#EDEDEE]">
                  Dungeon Master <span className="text-[#F94933]">*</span>
                </Label>
                <Input
                  id="dm"
                  value={dm}
                  onChange={(e) => setDm(e.target.value)}
                  placeholder="Enter DM name"
                  autoComplete="off"
                  className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-12 text-base"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#EDEDEE]">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your campaign..."
                  rows={3}
                  className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] resize-none text-base"
                />
              </div>

              {/* Players */}
              <div className="space-y-3">
                <Label className="text-[#EDEDEE]">
                  Players <span className="text-[#F94933]">*</span>
                </Label>

                {hasExistingSessions && (
                  <Alert className="bg-[#EEA232]/10 border-[#EEA232]/30">
                    <Lock className="h-4 w-4 text-[#EEA232]" />
                    <AlertDescription className="text-[#EEA232] text-sm">
                      Player and character names are locked after the first session. You can still add or remove
                      players.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Existing Players */}
                {players.length > 0 && (
                  <div className="space-y-2">
                    {players.map((player, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 items-start bg-[#101010] p-3 rounded-lg border border-[#A3A3A3]/20"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[#A3A3A3] text-xs mb-1">Player Name</Label>
                            {!hasExistingSessions ? (
                              <Input
                                id={`player-${idx}`}
                                value={player.playerName}
                                onChange={(e) => updatePlayerName(player.playerName, e.target.value)}
                                placeholder="e.g. John Smith"
                                className="bg-[#1D1D1D] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-9 text-sm"
                              />
                            ) : (
                              <div className="text-[#EDEDEE] text-sm font-medium flex items-center gap-2 py-2">
                                {player.playerName}
                                <Lock className="h-3 w-3 text-[#A3A3A3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`char-${idx}`} className="text-[#A3A3A3] text-xs mb-1">
                              Character Name
                            </Label>
                            {hasExistingSessions ? (
                              <div className="text-[#EDEDEE] text-sm flex items-center gap-2 py-2">
                                {player.characterName || <span className="text-[#A3A3A3] italic">None</span>}
                                <Lock className="h-3 w-3 text-[#A3A3A3]" />
                              </div>
                            ) : (
                              <Input
                                id={`char-${idx}`}
                                value={player.characterName || ""}
                                onChange={(e) => updatePlayerCharacter(player.playerName, e.target.value)}
                                placeholder="e.g. Gandalf the Grey"
                                className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-9 text-sm"
                              />
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayer(player.playerName)}
                          className="text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444] h-9 w-9 mt-5"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Player */}
                <div className="space-y-2 pt-2 border-t border-[#A3A3A3]/20">
                  <Label className="text-[#EDEDEE] text-sm">Add Player</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "player")}
                      placeholder="Player name (e.g. John Smith) *"
                      autoComplete="off"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-11 text-base"
                    />
                    <Input
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "character")}
                      placeholder="Character name (e.g. Gandalf the Grey)"
                      autoComplete="off"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-11 text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addPlayer}
                    variant="outline"
                    className="w-full border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10 h-11 bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#A3A3A3]/20">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white h-14 text-base font-semibold"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}

export default function EditCampaignPage() {
  return (
    <AuthGuard>
      <EditCampaignContent />
    </AuthGuard>
  )
}
