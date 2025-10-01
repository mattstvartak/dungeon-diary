import type { Timestamp } from "firebase/firestore"

export type TranscriptStatus = "none" | "pending" | "completed" | "error"
export type SummaryStatus = "none" | "pending" | "completed" | "error"
export type SessionStatus = "draft" | "active" | "ended"
export type AudioChunkStatus = "unprocessed" | "processing" | "completed" | "error"

export interface User {
  displayName: string
  email: string
  avatarUrl?: string
  createdAt: Timestamp
}

export interface Player {
  playerName: string
  characterName?: string
}

export interface Campaign {
  id?: string
  userId: string
  name: string
  dm: string
  players: Player[]
  description?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AudioChunk {
  path: string
  duration?: number
  uploadedAt?: Timestamp
  status?: AudioChunkStatus
}

export interface Session {
  id?: string
  userId: string
  campaignId: string
  title: string
  players?: string[]
  sessionPlayers?: Player[]
  absentPlayers?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  audioFilePath?: string
  audioChunks?: AudioChunk[] // Array of audio chunk objects
  duration?: number
  transcriptStatus: TranscriptStatus
  summaryStatus: SummaryStatus
  status: SessionStatus
}

export interface TranscriptSegment {
  speaker: string
  text: string
  startTime: number
  endTime: number
}

export interface ChunkTranscript {
  id?: string
  userId: string
  campaignId: string
  sessionId: string
  chunkFileName: string
  text: string
  segments: TranscriptSegment[]
  speakers: string[] // Array of speaker labels found in this chunk
  status: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface Transcript {
  id?: string
  userId: string
  campaignId: string
  sessionId: string
  segments: TranscriptSegment[]
  createdAt: Timestamp
}

export interface Summary {
  id?: string
  sessionId: string
  text: string
  createdAt: Timestamp
}

export interface Speaker {
  id?: string
  userId: string
  campaignId: string
  sessionId: string
  speakerLabel: string
  assignedName?: string
  updatedAt?: Timestamp
}
