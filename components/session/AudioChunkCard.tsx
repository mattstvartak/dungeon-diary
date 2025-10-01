"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Trash2 } from "lucide-react"
import type { AudioChunk, AudioChunkStatus } from "@/lib/types"

interface AudioChunkCardProps {
  chunk: AudioChunk
  index: number
  totalChunks: number
  isCurrentlyPlaying: boolean
  transcriptionStatus: {
    status: 'completed' | 'processing' | 'unprocessed' | 'error'
    message: string
  }
  isProcessing: boolean
  isReprocessing: boolean
  onPlayPause: () => void
  onProcess: () => void
  onReprocess: () => void
  onDelete: () => void
}

export function AudioChunkCard({
  chunk,
  index,
  totalChunks,
  isCurrentlyPlaying,
  transcriptionStatus,
  isProcessing,
  isReprocessing,
  onPlayPause,
  onProcess,
  onReprocess,
  onDelete
}: AudioChunkCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-[#22C55E] text-white"
      case 'processing':
        return "bg-[#F59E0B] text-white"
      case 'unprocessed':
        return "bg-[#6B7280] text-white"
      case 'error':
        return "bg-[#EF4444] text-white"
      default:
        return "bg-[#6B7280] text-white"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Transcribed'
      case 'processing':
        return 'Processing'
      case 'unprocessed':
        return 'Unprocessed'
      case 'error':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="border border-[#A3A3A3]/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[#EDEDEE] font-medium">Recording {index + 1}</h3>
          <p className="text-[#A3A3A3] text-sm">
            Chunk {index + 1} of {totalChunks}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#F94933] text-white">
            {chunk.duration ? formatDuration(chunk.duration) : "Unknown duration"}
          </Badge>
          <Badge className={getStatusBadgeColor(transcriptionStatus.status)}>
            {getStatusText(transcriptionStatus.status)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onPlayPause}
          size="sm"
          className="bg-[#F94933] hover:bg-[#F94933]/90 text-white"
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isCurrentlyPlaying ? "Pause" : "Play"}
        </Button>

        {/* Process/Reprocess buttons */}
        {transcriptionStatus.status === 'unprocessed' && (
          <Button
            onClick={onProcess}
            size="sm"
            disabled={isProcessing}
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
          >
            {isProcessing ? "Processing..." : "Process"}
          </Button>
        )}

        {transcriptionStatus.status === 'completed' && (
          <Button
            onClick={onReprocess}
            size="sm"
            disabled={isReprocessing}
            className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
          >
            {isReprocessing ? "Reprocessing..." : "Reprocess"}
          </Button>
        )}

        {transcriptionStatus.status === 'error' && (
          <Button
            onClick={onProcess}
            size="sm"
            disabled={isProcessing}
            className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white"
          >
            {isProcessing ? "Processing..." : "Retry"}
          </Button>
        )}

        <Button
          onClick={onDelete}
          size="sm"
          variant="outline"
          className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-sm text-[#A3A3A3]">
          <p>Path: {chunk.path || 'No path available'}</p>
          {chunk.uploadedAt && (
            <p>Uploaded: {chunk.uploadedAt.toDate().toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
