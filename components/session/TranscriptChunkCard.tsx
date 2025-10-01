"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { ChunkTranscript } from "@/lib/types"

interface TranscriptChunkCardProps {
  chunkTranscript: ChunkTranscript
  isReprocessing: boolean
  onReprocess: () => void
  onDelete: () => void
}

export function TranscriptChunkCard({
  chunkTranscript,
  isReprocessing,
  onReprocess,
  onDelete
}: TranscriptChunkCardProps) {
  return (
    <div className="border border-[#A3A3A3]/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#EEA232] font-semibold">{chunkTranscript.chunkFileName}</h3>
          <p className="text-[#A3A3A3] text-sm">
            {chunkTranscript.speakers?.length || 0} speaker(s) detected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onReprocess}
            disabled={isReprocessing}
            variant="outline"
            size="sm"
            className="border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10"
          >
            {isReprocessing ? "Processing..." : "Reprocess"}
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {chunkTranscript.segments && chunkTranscript.segments.length > 0 ? (
        <div className="space-y-2">
          {chunkTranscript.segments.map((segment, idx) => (
            <div key={idx} className="text-[#EDEDEE] leading-relaxed">
              {segment.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#A3A3A3] text-sm italic">No segments available for this chunk</p>
      )}
    </div>
  )
}
