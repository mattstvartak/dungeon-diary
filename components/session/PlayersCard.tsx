"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, X } from "lucide-react"
import type { Player } from "@/lib/types"

interface PlayersCardProps {
  campaignPlayers: Player[]
  sessionPlayers: Player[]
  absentPlayers: string[]
  isEditing: boolean
  onToggleEdit: () => void
  onAddPlayer: (playerName: string, characterName: string) => void
  onRemovePlayer: (playerName: string) => void
  onToggleAbsent: (playerName: string) => void
}

export function PlayersCard({
  campaignPlayers,
  sessionPlayers,
  absentPlayers,
  isEditing,
  onToggleEdit,
  onAddPlayer,
  onRemovePlayer,
  onToggleAbsent
}: PlayersCardProps) {
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newCharacterName, setNewCharacterName] = useState("")

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim(), newCharacterName.trim())
      setNewPlayerName("")
      setNewCharacterName("")
    }
  }

  const getDisplayName = (player: Player) => {
    return player.characterName || player.playerName
  }

  return (
    <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#EDEDEE] flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
            </CardTitle>
            <CardDescription className="text-[#A3A3A3]">
              Manage who attended this session
            </CardDescription>
          </div>
          <Button
            onClick={onToggleEdit}
            variant="outline"
            size="sm"
            className="border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10"
          >
            {isEditing ? "Done" : "Manage"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Campaign Players */}
          {campaignPlayers.length > 0 && (
            <div>
              <h4 className="text-[#EDEDEE] font-medium mb-2">Campaign Players</h4>
              <div className="flex flex-wrap gap-2">
                {campaignPlayers.map((player) => {
                  const displayName = getDisplayName(player)
                  const isAbsent = absentPlayers.includes(displayName)
                  
                  return (
                    <div key={displayName} className="flex items-center gap-2">
                      <Badge
                        className={`cursor-pointer ${
                          isAbsent
                            ? "bg-[#6B7280] text-white line-through"
                            : "bg-[#22C55E] text-white"
                        }`}
                        onClick={() => onToggleAbsent(displayName)}
                      >
                        {displayName}
                      </Badge>
                      {isEditing && (
                        <Button
                          onClick={() => onRemovePlayer(displayName)}
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Session Players */}
          {sessionPlayers.length > 0 && (
            <div>
              <h4 className="text-[#EDEDEE] font-medium mb-2">Session Players</h4>
              <div className="flex flex-wrap gap-2">
                {sessionPlayers.map((player) => {
                  const displayName = getDisplayName(player)
                  const isAbsent = absentPlayers.includes(displayName)
                  
                  return (
                    <div key={displayName} className="flex items-center gap-2">
                      <Badge
                        className={`cursor-pointer ${
                          isAbsent
                            ? "bg-[#6B7280] text-white line-through"
                            : "bg-[#22C55E] text-white"
                        }`}
                        onClick={() => onToggleAbsent(displayName)}
                      >
                        {displayName}
                      </Badge>
                      {isEditing && (
                        <Button
                          onClick={() => onRemovePlayer(displayName)}
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add New Player */}
          {isEditing && (
            <div className="border-t border-[#A3A3A3]/20 pt-4">
              <h4 className="text-[#EDEDEE] font-medium mb-2">Add Player</h4>
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="bg-[#101010] border-[#A3A3A3]/20 text-[#EDEDEE]"
                />
                <Input
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="Character name (optional)"
                  className="bg-[#101010] border-[#A3A3A3]/20 text-[#EDEDEE]"
                />
                <Button
                  onClick={handleAddPlayer}
                  size="sm"
                  className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
