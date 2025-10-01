"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import type { Session } from "@/lib/types"

interface SessionActionsCardProps {
  session: Session
  onEndSession: () => void
  onDeleteAll: () => void
}

export function SessionActionsCard({ session, onEndSession, onDeleteAll }: SessionActionsCardProps) {
  const hasAudioChunks = (session?.audioChunks?.length || 0) > 0

  return (
    <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
      <CardHeader>
        <CardTitle className="text-[#EDEDEE]">Session Actions</CardTitle>
        <CardDescription className="text-[#A3A3A3]">
          Manage your session recording and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onEndSession}
          variant="outline"
          className="w-full border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 h-12"
        >
          End Session
        </Button>
        {hasAudioChunks && (
          <Button
            onClick={onDeleteAll}
            variant="outline"
            className="w-full border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 h-12"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Audio & Transcripts
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
