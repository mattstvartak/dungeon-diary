"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TranscriptChunkCard } from "./TranscriptChunkCard"
import type { ChunkTranscript } from "@/lib/types"

interface TranscriptTabProps {
  chunkTranscripts: ChunkTranscript[]
  reprocessingChunks: Set<string>
  onReprocessChunk: (chunkFileName: string) => void
  onDeleteTranscriptChunk: (chunkFileName: string) => void
}

export function TranscriptTab({
  chunkTranscripts,
  reprocessingChunks,
  onReprocessChunk,
  onDeleteTranscriptChunk
}: TranscriptTabProps) {
  return (
    <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
      <CardHeader>
        <CardTitle className="text-[#EDEDEE]">Transcript</CardTitle>
        <CardDescription className="text-[#A3A3A3]">
          {chunkTranscripts.length > 0
            ? `${chunkTranscripts.length} chunk transcript(s) available`
            : "No transcripts available yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chunkTranscripts.length > 0 ? (
          <div className="space-y-6">
            {chunkTranscripts.map((chunkTranscript) => (
              <TranscriptChunkCard
                key={chunkTranscript.id}
                chunkTranscript={chunkTranscript}
                isReprocessing={reprocessingChunks.has(chunkTranscript.chunkFileName)}
                onReprocess={() => onReprocessChunk(chunkTranscript.chunkFileName)}
                onDelete={() => onDeleteTranscriptChunk(chunkTranscript.chunkFileName)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#A3A3A3] py-8">
            Transcripts will appear here once audio chunks are processed
          </p>
        )}
      </CardContent>
    </Card>
  )
}
