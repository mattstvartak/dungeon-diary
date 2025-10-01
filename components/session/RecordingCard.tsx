"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Square } from "lucide-react"

interface RecordingCardProps {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  chunks: string[]
  existingChunks: number
  isContinuingRecording: boolean
  nextChunkIndex: number
  platform: string
  isNative: boolean
  onPauseRecording: () => void
  onResumeRecording: () => void
  onStopRecording: () => void
}

export function RecordingCard({
  isRecording,
  isPaused,
  recordingTime,
  chunks,
  existingChunks,
  isContinuingRecording,
  nextChunkIndex,
  platform,
  isNative,
  onPauseRecording,
  onResumeRecording,
  onStopRecording
}: RecordingCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isRecording) return null

  return (
    <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
      <CardHeader>
        <CardTitle className="text-[#EDEDEE]">Recording in Progress</CardTitle>
        <CardDescription className="text-[#A3A3A3]">
          {isContinuingRecording
            ? `Continuing from chunk ${nextChunkIndex}`
            : "Your session is being recorded"}
          <br />
          <span className="text-xs text-[#6B7280]">
            Platform: {platform} • Native: {isNative ? 'Yes' : 'No'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-3 w-3 rounded-full bg-[#F94933] animate-pulse" />
          <span className="text-2xl font-mono text-[#EDEDEE]">{formatTime(recordingTime)}</span>
          {chunks.length > 0 && (
            <span className="text-sm text-[#A3A3A3]">
              ({(existingChunks || 0) + chunks.length} chunks)
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {!isPaused ? (
            <Button
              onClick={onPauseRecording}
              className="bg-[#EEA232] hover:bg-[#EEA232]/90 text-white h-12"
            >
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          ) : (
            <Button
              onClick={onResumeRecording}
              className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white h-12"
            >
              <Play className="mr-2 h-5 w-5" />
              Resume
            </Button>
          )}
          <Button onClick={onStopRecording} className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white h-12">
            <Square className="mr-2 h-5 w-5" />
            Stop
          </Button>
        </div>
        <p className="text-center text-[#A3A3A3] text-sm">
          Recording in 5-minute chunks for optimal processing
        </p>
      </CardContent>
    </Card>
  )
}
