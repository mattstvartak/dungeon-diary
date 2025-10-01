"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AudioChunkCard } from "./AudioChunkCard"
import type { AudioChunk, AudioChunkStatus } from "@/lib/types"

interface AudioTabProps {
  audioChunks: AudioChunk[]
  duration: number
  playingChunkIndex: number | null
  processingChunks: Set<string>
  reprocessingChunks: Set<string>
  onToggleChunkPlayPause: (index: number, chunkPath: string | undefined) => void
  onProcessChunk: (chunkPath: string) => void
  onReprocessChunk: (chunkPath: string) => void
  onDeleteChunk: (chunkPath: string, chunkIndex: number) => void
  getChunkTranscriptionStatus: (chunkPath: string | undefined) => {
    status: 'completed' | 'processing' | 'unprocessed' | 'error'
    message: string
  }
}

export function AudioTab({
  audioChunks,
  duration,
  playingChunkIndex,
  processingChunks,
  reprocessingChunks,
  onToggleChunkPlayPause,
  onProcessChunk,
  onReprocessChunk,
  onDeleteChunk,
  getChunkTranscriptionStatus
}: AudioTabProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
      <CardHeader>
        <CardTitle className="text-[#EDEDEE]">Recordings</CardTitle>
        <CardDescription className="text-[#A3A3A3]">
          {audioChunks && audioChunks.length > 0
            ? `${audioChunks.length} recording(s) • Total duration: ${formatDuration(duration)}`
            : "No recordings available"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {audioChunks && audioChunks.length > 0 ? (
          <div className="space-y-4">
            {audioChunks.map((chunk, index) => {
              const transcriptionStatus = getChunkTranscriptionStatus(chunk.path)
              const isCurrentlyPlaying = playingChunkIndex === index

              return (
                <AudioChunkCard
                  key={index}
                  chunk={chunk}
                  index={index}
                  totalChunks={audioChunks.length}
                  isCurrentlyPlaying={isCurrentlyPlaying}
                  transcriptionStatus={transcriptionStatus}
                  isProcessing={processingChunks.has(chunk.path)}
                  isReprocessing={reprocessingChunks.has(chunk.path)}
                  onPlayPause={() => onToggleChunkPlayPause(index, chunk.path)}
                  onProcess={() => onProcessChunk(chunk.path)}
                  onReprocess={() => onReprocessChunk(chunk.path)}
                  onDelete={() => onDeleteChunk(chunk.path, index)}
                />
              )
            })}
          </div>
        ) : (
          <p className="text-center text-[#A3A3A3] py-8">
            No audio recordings for this session yet. Start recording to add some!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
