"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit2, Save, X, ArrowLeft } from "lucide-react"
import type { Session } from "@/lib/types"

interface SessionHeaderProps {
  session: Session
  onUpdateTitle: (title: string) => Promise<void>
  onBack: () => void
}

export function SessionHeader({ session, onUpdateTitle, onBack }: SessionHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(session.title || "")

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== session.title) {
      await onUpdateTitle(editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(session.title || "")
    setIsEditingTitle(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-[#6B7280] text-white"
      case "active":
        return "bg-[#F94933] text-white"
      case "completed":
        return "bg-[#22C55E] text-white"
      default:
        return "bg-[#6B7280] text-white"
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="border-[#A3A3A3]/20 text-[#A3A3A3] hover:bg-[#A3A3A3]/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="bg-[#1D1D1D] border-[#A3A3A3]/20 text-[#EDEDEE] w-64"
                placeholder="Session title"
                autoFocus
              />
              <Button
                onClick={handleSaveTitle}
                size="sm"
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="sm"
                variant="outline"
                className="border-[#A3A3A3]/20 text-[#A3A3A3] hover:bg-[#A3A3A3]/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#EDEDEE]">
                {session.title || "Untitled Session"}
              </h1>
              <Button
                onClick={() => setIsEditingTitle(true)}
                size="sm"
                variant="outline"
                className="border-[#A3A3A3]/20 text-[#A3A3A3] hover:bg-[#A3A3A3]/10"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={getStatusColor(session.status)}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </Badge>
        {session.duration > 0 && (
          <span className="text-[#A3A3A3] text-sm">
            {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  )
}
