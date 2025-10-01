"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  getSession,
  updateSession,
  deleteSession,
  getTranscriptBySessionId,
  getSummaryBySessionId,
  getSpeakersBySessionId,
  getCampaign,
  getChunkTranscriptsBySessionId,
  getSessionTranscriptsBySpeaker,
  deleteChunkTranscript,
  deleteChunkSpeakers,
} from "@/lib/firestore"
import { deleteField, deleteDoc, doc } from "firebase/firestore"
import { storage, db } from "@/lib/firebase"
import { ref, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import type { Session, Transcript, Summary, Speaker, Player, Campaign, ChunkTranscript, AudioChunk, AudioChunkStatus, TranscriptSegment } from "@/lib/types"

export function useSessionData(sessionId: string, userId: string | undefined) {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [session, setSession] = useState<Session | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [chunkTranscripts, setChunkTranscripts] = useState<ChunkTranscript[]>([])
  const [speakerTranscripts, setSpeakerTranscripts] = useState<{ [speaker: string]: TranscriptSegment[] }>({})
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({})

  // Load session data
  const loadSessionData = useCallback(async () => {
    if (!userId) {
      console.log("[v0] User not authenticated yet")
      return
    }

    try {
      console.log("[v0] Loading session:", sessionId, "for user:", userId)
      const sessionData = await getSession(userId, sessionId)

      if (!sessionData) {
        toast({
          title: "Session not found",
          description: "This session does not exist",
          variant: "destructive",
        })
        router.push("/app")
        return
      }

      if (sessionData.userId !== userId) {
        console.error("[v0] Permission denied: Session belongs to different user")
        toast({
          title: "Access denied",
          description: "You don't have permission to view this session",
          variant: "destructive",
        })
        router.push("/app")
        return
      }

      setSession(sessionData)
      setNotes(sessionData.notes || "")
      
      console.log("[v0] Session data loaded:", {
        id: sessionData.id,
        status: sessionData.status,
        audioChunks: sessionData.audioChunks,
        audioChunksLength: sessionData.audioChunks?.length || 0,
        duration: sessionData.duration
      })
      console.log("[v0] Audio chunks details:", sessionData.audioChunks?.map((chunk, index) => ({
        index,
        path: chunk.path,
        duration: chunk.duration,
        status: chunk.status
      })))

      if (sessionData.campaignId) {
        const campaignData = await getCampaign(userId, sessionData.campaignId)
        setCampaign(campaignData)
      }

      if (sessionData.audioFilePath) {
        try {
          const audioRef = ref(storage, sessionData.audioFilePath)
          const url = await getDownloadURL(audioRef)
          setAudioUrl(url)
        } catch (error) {
          console.error("[v0] Error loading audio:", error)
        }
      }

      // Load transcript, summary, and speakers data
      const [transcriptData, summaryData, speakersData, chunkTranscriptsData, speakerTranscriptsData] = await Promise.all([
        getTranscriptBySessionId(userId, sessionId),
        getSummaryBySessionId(userId, sessionId),
        getSpeakersBySessionId(userId, sessionId),
        getChunkTranscriptsBySessionId(userId, sessionId),
        getSessionTranscriptsBySpeaker(userId, sessionId),
      ])

      setTranscript(transcriptData)
      setSummary(summaryData)
      setSpeakers(speakersData)
      setChunkTranscripts(chunkTranscriptsData)
      setSpeakerTranscripts(speakerTranscriptsData)

      const names: Record<string, string> = {}
      speakersData.forEach((speaker) => {
        names[speaker.id!] = speaker.assignedName || speaker.speakerLabel
      })
      setSpeakerNames(names)

      // Sync audio chunks with storage
      console.log("[v0] About to sync audio chunks with storage")
      await syncAudioChunksWithStorage(userId, sessionId, sessionData)
    } catch (error) {
      console.error("[v0] Error loading session:", error)
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [sessionId, userId, router, toast])

  // Sync audio chunks with storage
  const syncAudioChunksWithStorage = useCallback(async (userId: string, sessionId: string, sessionData: Session) => {
    try {
      console.log("[v0] Syncing audio chunks with storage for session:", sessionId)
      console.log("[v0] Current session data audioChunks:", sessionData.audioChunks)
      
      // List all audio files in the session's storage directory
      const sessionStoragePath = `users/${userId}/sessions/${sessionId}`
      const sessionRef = ref(storage, sessionStoragePath)
      const listResult = await listAll(sessionRef)
      
      // Filter for audio chunk files (audio_chunk_*.webm)
      const audioFiles = listResult.items.filter(item => 
        item.name.startsWith('audio_chunk_') && item.name.endsWith('.webm')
      )
      
      console.log("[v0] Found audio files in storage:", audioFiles.map(f => f.fullPath))
      console.log("[v0] Total files in storage directory:", listResult.items.length)
      console.log("[v0] All files in storage:", listResult.items.map(f => f.name))
      
      // Get current audio chunks from Firestore
      const currentChunks = sessionData.audioChunks || []
      const currentPaths = Array.isArray(currentChunks) ? currentChunks.map(chunk => chunk.path) : []
      
      console.log("[v0] Current chunks in Firestore:", currentPaths)
      console.log("[v0] Current chunks count in Firestore:", currentPaths.length)
      
      // Find missing chunks (in storage but not in Firestore)
      const missingChunks: AudioChunk[] = []
      for (const audioFile of audioFiles) {
        if (!currentPaths.includes(audioFile.fullPath)) {
          console.log("[v0] Found missing chunk:", audioFile.fullPath)
          missingChunks.push({
            path: audioFile.fullPath,
            status: "unprocessed" as AudioChunkStatus,
          })
        } else {
          console.log("[v0] Chunk already exists in Firestore:", audioFile.fullPath)
        }
      }
      
      console.log("[v0] Missing chunks count:", missingChunks.length)
      console.log("[v0] Missing chunks:", missingChunks)
      
      if (missingChunks.length > 0) {
        console.log("[v0] Adding missing chunks to session:", missingChunks)
        
        // Update session with missing chunks
        const updatedChunks = [...(Array.isArray(currentChunks) ? currentChunks : []), ...missingChunks]
        console.log("[v0] Updated chunks count:", updatedChunks.length)
        console.log("[v0] Updated chunks:", updatedChunks)
        
        await updateSession(userId, sessionId, {
          audioChunks: updatedChunks
        })
        
        // Reload session data to reflect changes
        await loadSessionData()
        
        toast({
          title: "Audio chunks synced",
          description: `Found and added ${missingChunks.length} missing audio chunk(s)`,
        })
      } else {
        console.log("[v0] No missing chunks found")
      }
    } catch (error) {
      console.error("[v0] Error syncing audio chunks with storage:", error)
    }
  }, [loadSessionData, toast])

  // Update session title
  const updateSessionTitle = useCallback(async (title: string) => {
    if (!userId || !session) return

    try {
      await updateSession(userId, sessionId, { title })
      setSession(prev => prev ? { ...prev, title } : null)
      toast({
        title: "Title updated",
        description: "Session title has been saved",
      })
    } catch (error) {
      console.error("[v0] Error updating session title:", error)
      toast({
        title: "Error",
        description: "Failed to update session title",
        variant: "destructive",
      })
    }
  }, [userId, session, sessionId, toast])

  // Save notes
  const saveNotes = useCallback(async () => {
    if (!userId || !session) return

    try {
      await updateSession(userId, sessionId, { notes })
      toast({
        title: "Notes saved",
        description: "Session notes have been saved",
      })
    } catch (error) {
      console.error("[v0] Error saving notes:", error)
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      })
    }
  }, [userId, session, sessionId, notes, toast])

  // Delete chunk
  const deleteChunk = useCallback(async (chunkPath: string, chunkIndex: number) => {
    if (!userId || !session) return

    try {
      // Delete audio file from Firebase Storage
      if (chunkPath) {
        const audioRef = ref(storage, chunkPath)
        try {
          await deleteObject(audioRef)
          console.log(`[v0] Deleted audio file: ${chunkPath}`)
        } catch (error) {
          console.warn(`[v0] Could not delete audio file ${chunkPath}:`, error)
        }
      }

      // Extract chunk filename from path for transcript deletion
      const chunkFileName = chunkPath.split('/').pop() || ''
      
      // Delete transcript data for this chunk
      await deleteChunkTranscript(userId, sessionId, chunkFileName)
      
      // Delete speaker data for this chunk
      await deleteChunkSpeakers(userId, sessionId, chunkFileName)

      // Update session to remove this chunk
      const updatedChunks = session?.audioChunks?.filter((_, index) => index !== chunkIndex) || []
      const totalDuration = updatedChunks.reduce((sum, chunk) => sum + (chunk.duration || 0), 0)

      await updateSession(userId, sessionId, {
        audioChunks: updatedChunks,
        duration: totalDuration,
      })

      // Reload session data
      await loadSessionData()

      toast({
        title: "Chunk deleted",
        description: `Recording chunk ${chunkIndex + 1} and its transcript have been deleted.`,
      })
    } catch (error) {
      console.error("[v0] Error deleting chunk:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete chunk. Please try again.",
        variant: "destructive",
      })
    }
  }, [userId, session, sessionId, loadSessionData, toast])

  // Delete transcript chunk
  const deleteTranscriptChunk = useCallback(async (chunkFileName: string) => {
    if (!userId) return

    try {
      // Delete transcript data for this chunk
      await deleteChunkTranscript(userId, sessionId, chunkFileName)
      
      // Delete speaker data for this chunk
      await deleteChunkSpeakers(userId, sessionId, chunkFileName)

      // Reload session data
      await loadSessionData()

      toast({
        title: "Transcript deleted",
        description: `Transcript for ${chunkFileName} has been deleted.`,
      })
    } catch (error) {
      console.error("[v0] Error deleting transcript chunk:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete transcript. Please try again.",
        variant: "destructive",
      })
    }
  }, [userId, sessionId, loadSessionData, toast])

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadSessionData()
    }
  }, [userId, loadSessionData])

  return {
    // State
    session,
    campaign,
    transcript,
    summary,
    speakers,
    chunkTranscripts,
    speakerTranscripts,
    audioUrl,
    loading,
    notes,
    speakerNames,
    
    // Actions
    loadSessionData,
    updateSessionTitle,
    saveNotes,
    deleteChunk,
    deleteTranscriptChunk,
    setNotes,
  }
}
