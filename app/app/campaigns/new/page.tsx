"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { createCampaign } from "@/lib/firestore"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, X, Plus } from "lucide-react"
import Link from "next/link"

function NewCampaignContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [dm, setDm] = useState("")
  const [description, setDescription] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newCharacterName, setNewCharacterName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const updatePlayerCharacter = (playerName: string, characterName: string) => {
    setPlayers(
      players.map((p) =>
        p.playerName === playerName ? { ...p, characterName: characterName.trim() || undefined } : p,
      ),
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
      const campaignData: any = {
        userId: user.uid,
        name: name.trim(),
        dm: dm.trim(),
        players,
      }

      if (description.trim()) {
        campaignData.description = description.trim()
      }

      const campaignId = await createCampaign(campaignData)

      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully",
      })

      router.push("/app")
    } catch (error) {
      console.error("[v0] Error creating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-xl font-bold text-[#F94933]">New Campaign</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
            <CardHeader>
              <CardTitle className="text-[#EDEDEE]">Campaign Details</CardTitle>
              <CardDescription className="text-[#A3A3A3]">Create a new campaign for your adventures</CardDescription>
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

              <div className="space-y-3">
                <Label className="text-[#EDEDEE]">
                  Players <span className="text-[#F94933]">*</span>
                </Label>

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
                            <div className="text-[#EDEDEE] text-sm font-medium">{player.playerName}</div>
                          </div>
                          <div>
                            <Label htmlFor={`char-${idx}`} className="text-[#A3A3A3] text-xs mb-1">
                              Character Name
                            </Label>
                            <Input
                              id={`char-${idx}`}
                              value={player.characterName || ""}
                              onChange={(e) => updatePlayerCharacter(player.playerName, e.target.value)}
                              placeholder="Optional"
                              className="bg-[#1D1D1D] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-9 text-sm"
                            />
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
                  {isSubmitting ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <AuthGuard>
      <NewCampaignContent />
    </AuthGuard>
  )
}
