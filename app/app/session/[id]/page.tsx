"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import {
  getSession,
  updateSession,
  deleteSession,
  getTranscriptBySessionId,
  getSummaryBySessionId,
  getSpeakersBySessionId,
  createSession,
  getCampaign,
  getChunkTranscriptsBySessionId,
  getSessionTranscriptsBySpeaker,
  deleteChunkTranscript,
  deleteChunkSpeakers,
} from "@/lib/firestore"
import { deleteField, deleteDoc, doc } from "firebase/firestore"
import { processAudio, reprocessAudio } from "@/lib/functions"
import { requestNotificationPermission, sendNotification, setupNotificationListeners, hasNotificationPermission } from "@/lib/notifications"
import type { Session, Transcript, Summary, Speaker, Player, Campaign, ChunkTranscript, AudioChunk, AudioChunkStatus, TranscriptSegment } from "@/lib/types"
import { storage, db } from "@/lib/firebase"
import { ref, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { toast as sonnerToast } from "sonner"
import {
  ArrowLeft,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Plus,
  X,
  Users,
  Mic,
  Square,
} from "lucide-react"
import { useHybridAudioRecorder } from "@/hooks/use-hybrid-audio-recorder"

function SessionDetailContent() {
  const params = useParams()
  const sessionId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [session, setSession] = useState<Session | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [chunkTranscripts, setChunkTranscripts] = useState<ChunkTranscript[]>([])
  const [speakerTranscripts, setSpeakerTranscripts] = useState<{ [speaker: string]: TranscriptSegment[] }>({})
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [playingChunkIndex, setPlayingChunkIndex] = useState<number | null>(null)
  const [chunkAudioElements, setChunkAudioElements] = useState<Map<number, HTMLAudioElement>>(new Map())
  const [notes, setNotes] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({})
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([])
  const [newSessionPlayerName, setNewSessionPlayerName] = useState("")
  const [newSessionCharacterName, setNewSessionCharacterName] = useState("")
  const [isEditingPlayers, setIsEditingPlayers] = useState(false)
  const [absentPlayers, setAbsentPlayers] = useState<string[]>([])
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [isContinuingRecording, setIsContinuingRecording] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
  const [reprocessingChunks, setReprocessingChunks] = useState<Set<string>>(new Set())
  const [processingChunks, setProcessingChunks] = useState<Set<string>>(new Set())
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const nextChunkIndex = session?.audioChunks?.length || 0

  const audioRecorder = useHybridAudioRecorder({
    userId: user?.uid || "",
    sessionId: sessionId || "",
    chunkDuration: 300,
    startChunkIndex: isContinuingRecording ? nextChunkIndex : 0,
    onChunkUploaded: (chunkIndex, path) => {
      console.log(`[v0] Chunk ${chunkIndex} uploaded: ${path}`)
    },
    onError: (error) => {
      console.error("[v0] Recording error:", error)
      toast({
        title: "Recording error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (user && sessionId) {
      // Add a small delay to ensure auth state is fully established
      const timer = setTimeout(() => {
        loadSessionData()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, sessionId])

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const hasPermission = await hasNotificationPermission()
        if (!hasPermission) {
          const granted = await requestNotificationPermission()
          setNotificationsEnabled(granted)
        } else {
          setNotificationsEnabled(true)
        }

        // Set up notification listeners
        setupNotificationListeners((notification) => {
          console.log("[v0] Notification received:", notification)
          // Handle notification tap - could navigate to specific session or refresh data
          if (notification.data?.sessionId === sessionId) {
            loadSessionData()
          }
        })
      } catch (error) {
        console.error("[v0] Error initializing notifications:", error)
      }
    }

    initializeNotifications()
  }, [sessionId])

  const loadSessionData = async () => {
    if (!user?.uid) {
      console.log("[v0] User not authenticated yet")
      return
    }

    try {
      console.log("[v0] Loading session:", sessionId, "for user:", user.uid)
      const sessionData = await getSession(user.uid, sessionId)

      if (!sessionData) {
        toast({
          title: "Session not found",
          description: "This session does not exist",
          variant: "destructive",
        })
        router.push("/app")
        return
      }

      if (sessionData.userId !== user.uid) {
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
      setEditedTitle(sessionData.title)
      setSessionPlayers(sessionData.sessionPlayers || [])
      setAbsentPlayers(sessionData.absentPlayers || [])
      
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
        const campaignData = await getCampaign(user.uid, sessionData.campaignId)
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

      if (user?.uid) {
        const [transcriptData, summaryData, speakersData, chunkTranscriptsData, speakerTranscriptsData] = await Promise.all([
          getTranscriptBySessionId(user.uid, sessionId),
          getSummaryBySessionId(user.uid, sessionId),
          getSpeakersBySessionId(user.uid, sessionId),
          getChunkTranscriptsBySessionId(user.uid, sessionId),
          getSessionTranscriptsBySpeaker(user.uid, sessionId),
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
      }

      // Sync audio chunks with storage
      if (user?.uid && sessionData) {
        console.log("[v0] About to sync audio chunks with storage")
        await syncAudioChunksWithStorage(user.uid, sessionId, sessionData)
      }
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
  }

  const addSessionPlayer = () => {
    if (newSessionPlayerName.trim()) {
      const playerExists = sessionPlayers.some((p) => p.playerName === newSessionPlayerName.trim())
      if (playerExists) {
        toast({
          title: "Player exists",
          description: "This player is already in this session",
          variant: "destructive",
        })
        return
      }

      setSessionPlayers([
        ...sessionPlayers,
        {
          playerName: newSessionPlayerName.trim(),
          characterName: newSessionCharacterName.trim() || undefined,
        },
      ])
      setNewSessionPlayerName("")
      setNewSessionCharacterName("")
    }
  }

  const removeSessionPlayer = (playerName: string) => {
    setSessionPlayers(sessionPlayers.filter((p) => p.playerName !== playerName))
  }

  const toggleCampaignPlayer = (playerName: string) => {
    if (absentPlayers.includes(playerName)) {
      setAbsentPlayers(absentPlayers.filter((p) => p !== playerName))
    } else {
      setAbsentPlayers([...absentPlayers, playerName])
    }
  }

  const syncAudioChunksWithStorage = async (userId: string, sessionId: string, sessionData: Session) => {
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
            // We can't get duration from storage metadata easily, so leave it undefined
            // It will be calculated when the audio is played
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
      // Don't show error toast for sync failures as it's not critical
    }
  }

  const saveSessionPlayers = async () => {
    if (!session || !user?.uid) return

    try {
      await updateSession(user.uid, sessionId, { sessionPlayers, absentPlayers })
      setSession({ ...session, sessionPlayers, absentPlayers })
      setIsEditingPlayers(false)
      toast({
        title: "Players updated",
        description: "Session players have been saved",
      })
    } catch (error) {
      console.error("[v0] Error updating session players:", error)
      toast({
        title: "Error",
        description: "Failed to update session players",
        variant: "destructive",
      })
    }
  }

  const processChunk = async (chunkPath: string) => {
    if (!user?.uid) {
      console.error("[v0] No user found for processChunk")
      return
    }

    try {
      // Extract chunk filename from path
      const chunkFileName = chunkPath.split('/').pop() || ''
      
      console.log("[v0] Processing chunk:", {
        chunkPath,
        chunkFileName,
        userId: user.uid,
        sessionId,
        userEmail: user.email
      })
      
      // Add to processing set
      setProcessingChunks(prev => new Set(prev).add(chunkPath))
      
      // Update chunk status to processing
      if (session?.audioChunks) {
        const updatedChunks = session.audioChunks.map(chunk => 
          chunk.path === chunkPath 
            ? { ...chunk, status: "processing" as AudioChunkStatus }
            : chunk
        )
        await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
        setSession({ ...session, audioChunks: updatedChunks })
      }

      const result = await processAudio({
        uid: user.uid,
        sessionId,
        chunkFileName
      })

      if (result.ok) {
        // Update chunk status to completed
        if (session?.audioChunks) {
          const updatedChunks = session.audioChunks.map(chunk => 
            chunk.path === chunkPath 
              ? { ...chunk, status: "completed" as AudioChunkStatus }
              : chunk
          )
          await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
          setSession({ ...session, audioChunks: updatedChunks })
        }

        // Send local notification
        if (notificationsEnabled) {
          await sendNotification({
            title: "Audio Processing Complete",
            body: `Your audio chunk ${chunkFileName} has been transcribed successfully.`,
            data: {
              sessionId,
              chunkFileName,
              type: "audio_processed"
            }
          })
        }

        // Show both desktop and toast notifications for web
        toast({
          title: "Processing complete",
          description: "Audio chunk has been transcribed successfully",
        })
        
        // Also show Sonner toast for better web experience
        sonnerToast.success("Audio Processing Complete", {
          description: `Your audio chunk ${chunkFileName} has been transcribed successfully.`,
          duration: 5000,
        })

        // Reload session data to get updated transcripts
        await loadSessionData()
      }
    } catch (error) {
      console.error("[v0] Error processing chunk:", error)
      
      // Update chunk status to error
      if (session?.audioChunks) {
        const updatedChunks = session.audioChunks.map(chunk => 
          chunk.path === chunkPath 
            ? { ...chunk, status: "error" as AudioChunkStatus }
            : chunk
        )
        await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
        setSession({ ...session, audioChunks: updatedChunks })
      }

      toast({
        title: "Processing failed",
        description: "Failed to transcribe audio chunk",
        variant: "destructive",
      })
    } finally {
      // Remove from processing set
      setProcessingChunks(prev => {
        const newSet = new Set(prev)
        newSet.delete(chunkPath)
        return newSet
      })
    }
  }

  const reprocessChunk = async (chunkPath: string) => {
    if (!user?.uid) {
      console.error("[v0] No user found for reprocessChunk")
      return
    }

    try {
      // Extract chunk filename from path
      const chunkFileName = chunkPath.split('/').pop() || ''
      
      console.log("[v0] Reprocessing chunk:", {
        chunkPath,
        chunkFileName,
        userId: user.uid,
        sessionId,
        userEmail: user.email
      })
      
      // Add to reprocessing set
      setReprocessingChunks(prev => new Set(prev).add(chunkPath))
      
      // Update chunk status to processing
      if (session?.audioChunks) {
        const updatedChunks = session.audioChunks.map(chunk => 
          chunk.path === chunkPath 
            ? { ...chunk, status: "processing" as AudioChunkStatus }
            : chunk
        )
        await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
        setSession({ ...session, audioChunks: updatedChunks })
      }

      const result = await reprocessAudio({
        uid: user.uid,
        sessionId,
        chunkFileName
      })

      if (result.ok) {
        // Update chunk status to completed
        if (session?.audioChunks) {
          const updatedChunks = session.audioChunks.map(chunk => 
            chunk.path === chunkPath 
              ? { ...chunk, status: "completed" as AudioChunkStatus }
              : chunk
          )
          await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
          setSession({ ...session, audioChunks: updatedChunks })
        }

        // Send local notification
        if (notificationsEnabled) {
          await sendNotification({
            title: "Audio Reprocessing Complete",
            body: `Your audio chunk ${chunkFileName} has been re-transcribed successfully.`,
            data: {
              sessionId,
              chunkFileName,
              type: "audio_reprocessed"
            }
          })
        }

        // Show both desktop and toast notifications for web
        toast({
          title: "Reprocessing complete",
          description: "Audio chunk has been re-transcribed successfully",
        })
        
        // Also show Sonner toast for better web experience
        sonnerToast.success("Audio Reprocessing Complete", {
          description: `Your audio chunk ${chunkFileName} has been re-transcribed successfully.`,
          duration: 5000,
        })

        // Reload session data to get updated transcripts
        await loadSessionData()
      }
    } catch (error) {
      console.error("[v0] Error reprocessing chunk:", error)
      
      // Update chunk status to error
      if (session?.audioChunks) {
        const updatedChunks = session.audioChunks.map(chunk => 
          chunk.path === chunkPath 
            ? { ...chunk, status: "error" as AudioChunkStatus }
            : chunk
        )
        await updateSession(user.uid, sessionId, { audioChunks: updatedChunks })
        setSession({ ...session, audioChunks: updatedChunks })
      }

      toast({
        title: "Reprocessing failed",
        description: "Failed to re-transcribe audio chunk",
        variant: "destructive",
      })
    } finally {
      // Remove from reprocessing set
      setReprocessingChunks(prev => {
        const newSet = new Set(prev)
        newSet.delete(chunkPath)
        return newSet
      })
    }
  }

  const startRecording = async () => {
    if (!user?.uid) return
    try {
      await audioRecorder.startRecording()
      await updateSession(user.uid, sessionId, { status: "active" })
      await loadSessionData()
      toast({
        title: "Recording started",
        description: "Your session is being recorded in chunks for optimal processing",
      })
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      })
    }
  }

  const continueRecording = async () => {
    if (!user?.uid) return
    setIsContinuingRecording(true)
    setShowContinueDialog(false)
    try {
      await audioRecorder.startRecording()
      await updateSession(user.uid, sessionId, { status: "active" })
      await loadSessionData()
      toast({
        title: "Recording continued",
        description: `Continuing from chunk ${nextChunkIndex}`,
      })
    } catch (error) {
      console.error("[v0] Error continuing recording:", error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      })
      setIsContinuingRecording(false)
    }
  }

  const restartRecording = async () => {
    if (!user?.uid) return
    setIsContinuingRecording(false)
    setShowRestartDialog(false)
    try {
      // Delete existing audio chunks from Firebase Storage
      if (session?.audioChunks && session.audioChunks.length > 0) {
        const deletePromises = session.audioChunks.map(async (chunk) => {
          if (chunk.path) {
            try {
              const audioRef = ref(storage, chunk.path)
              await deleteObject(audioRef)
              console.log("[v0] Deleted audio chunk:", chunk.path)
            } catch (error) {
              console.error("[v0] Error deleting audio chunk:", chunk.path, error)
              // Continue with other deletions even if one fails
            }
          }
        })
        await Promise.all(deletePromises)
      }

      // Update session to clear audio data and mark as draft
      const updateData: any = {
        audioChunks: [],
        duration: 0,
        status: "draft",
        transcriptStatus: "none",
        summaryStatus: "none",
      }
      
      // Remove audioFilePath field if it exists
      if (session?.audioFilePath) {
        updateData.audioFilePath = deleteField()
      }
      
      await updateSession(user.uid, sessionId, updateData)

      await loadSessionData()
      await audioRecorder.startRecording()
      toast({
        title: "Recording restarted",
        description: "Previous audio has been cleared. Starting fresh recording.",
      })
    } catch (error) {
      console.error("[v0] Error restarting recording:", error)
      toast({
        title: "Error",
        description: "Failed to restart recording",
        variant: "destructive",
      })
    }
  }

  const stopRecording = async () => {
    if (!user?.uid) return
    try {
      const chunks = await audioRecorder.stopRecording()
      console.log("[v0] Received chunks from audioRecorder:", chunks)

      if (chunks.length > 0) {
        const existingChunks = session?.audioChunks || []
        const audioChunks: AudioChunk[] = chunks.map(path => ({ path, status: "unprocessed" as AudioChunkStatus }))
        const allChunks: AudioChunk[] = isContinuingRecording ? [...existingChunks, ...audioChunks] : audioChunks

        console.log("[v0] Saving audio chunks:", {
          allChunks,
          allChunksLength: allChunks.length,
          recordingTime: audioRecorder.recordingTime
        })
        
        await updateSession(user.uid, sessionId, {
          audioChunks: allChunks,
          duration: audioRecorder.recordingTime,
        })

        toast({
          title: "Recording saved",
          description: `Your session has been recorded in ${allChunks.length} chunk(s)`,
        })

        setIsContinuingRecording(false)
        await loadSessionData()
      }
    } catch (error) {
      console.error("[v0] Error stopping recording:", error)
      toast({
        title: "Error",
        description: "Failed to save recording",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlayPause = () => {
    if (!audioUrl) return

    if (!audioElement) {
      const audio = new Audio(audioUrl)
      audio.addEventListener("ended", () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleChunkPlayPause = async (chunkIndex: number, chunkPath: string | undefined) => {
    if (!chunkPath) {
      toast({
        title: "Playback Error",
        description: "No audio path available for this chunk",
        variant: "destructive",
      })
      return
    }

    try {
      // Stop any currently playing chunk
      if (playingChunkIndex !== null && playingChunkIndex !== chunkIndex) {
        const currentAudio = chunkAudioElements.get(playingChunkIndex)
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      // Get or create audio element for this chunk
      let audio = chunkAudioElements.get(chunkIndex)
      if (!audio) {
        const audioRef = ref(storage, chunkPath)
        const audioUrl = await getDownloadURL(audioRef)
        audio = new Audio(audioUrl)
        audio.addEventListener("ended", () => {
          setPlayingChunkIndex(null)
        })
        setChunkAudioElements(prev => new Map(prev).set(chunkIndex, audio!))
      }

      if (playingChunkIndex === chunkIndex) {
        // Pause current chunk
        audio.pause()
        setPlayingChunkIndex(null)
      } else {
        // Play this chunk
        audio.currentTime = 0
        await audio.play()
        setPlayingChunkIndex(chunkIndex)
      }
    } catch (error) {
      console.error("[v0] Error playing chunk:", error)
      toast({
        title: "Playback Error",
        description: "Failed to load audio chunk",
        variant: "destructive",
      })
    }
  }

  const getChunkTranscriptionStatus = (chunkPath: string | undefined) => {
    if (!chunkPath) {
      return { status: 'error', message: 'No path available' }
    }
    
    // Find the chunk in the session's audioChunks array
    const chunk = session?.audioChunks?.find(c => c.path === chunkPath)
    const chunkStatus = chunk?.status || 'unprocessed'
    
    // If chunk has a specific status, use that
    if (chunkStatus === 'processing') {
      return { status: 'processing', message: 'Processing...' }
    }
    
    if (chunkStatus === 'error') {
      return { status: 'error', message: 'Processing failed' }
    }
    
    if (chunkStatus === 'unprocessed') {
      return { status: 'unprocessed', message: 'Not processed' }
    }
    
    // For completed status, check if transcript exists
    if (chunkStatus === 'completed') {
      const chunkFileName = chunkPath.split('/').pop()?.replace('.webm', '') || ''
      const transcript = chunkTranscripts.find(ct => ct.chunkFileName === chunkFileName)
      
      if (transcript && transcript.segments && transcript.segments.length > 0) {
        return { status: 'completed', message: `${transcript.segments.length} segments` }
      } else {
        return { status: 'completed', message: 'Processed (no segments)' }
      }
    }
    
    // Fallback to old logic for chunks without status
    const chunkFileName = chunkPath.split('/').pop()?.replace('.webm', '') || ''
    const transcript = chunkTranscripts.find(ct => ct.chunkFileName === chunkFileName)
    
    if (!transcript) {
      return { status: 'unprocessed', message: 'Not processed' }
    }
    
    if (transcript.segments && transcript.segments.length > 0) {
      return { status: 'completed', message: `${transcript.segments.length} segments` }
    }
    
    return { status: 'error', message: 'No segments found' }
  }

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || !session || !user?.uid) return

    try {
      await updateSession(user.uid, sessionId, { title: editedTitle.trim() })
      setSession({ ...session, title: editedTitle.trim() })
      setIsEditingTitle(false)
      toast({
        title: "Title updated",
        description: "Session title has been saved",
      })
    } catch (error) {
      console.error("[v0] Error updating title:", error)
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async () => {
    if (!user?.uid) return
    try {
      await deleteSession(user.uid, sessionId)
      toast({
        title: "Session deleted",
        description: "Your session has been removed",
      })
      router.push("/app")
    } catch (error) {
      console.error("[v0] Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  const handleRestartSession = async () => {
    if (!session) return

    try {
      const newSessionId = await createSession({
        userId: session.userId,
        campaignId: session.campaignId,
        title: `${session.title} - Restarted`,
        players: session.players,
        sessionPlayers: session.sessionPlayers,
        transcriptStatus: "none",
        summaryStatus: "none",
        status: "draft",
      })

      toast({
        title: "Session restarted",
        description: "A new session has been created",
      })

      router.push(`/app/new?sessionId=${newSessionId}&campaignId=${session.campaignId}`)
    } catch (error) {
      console.error("[v0] Error restarting session:", error)
      toast({
        title: "Error",
        description: "Failed to restart session",
        variant: "destructive",
      })
    }
  }

  const handleEndSession = async () => {
    if (!user?.uid) return
    try {
      await updateSession(user.uid, sessionId, { status: "ended" })
      await loadSessionData()
      setShowEndSessionDialog(false)
      toast({
        title: "Session ended",
        description: "This session has been marked as complete. No more recordings can be made.",
      })
    } catch (error) {
      console.error("[v0] Error ending session:", error)
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      })
    }
  }



  const deleteTranscriptChunk = async (chunkFileName: string) => {
    if (!user?.uid) return

    try {
      // Delete transcript data for this chunk
      await deleteChunkTranscript(user.uid, sessionId, chunkFileName)
      
      // Delete speaker data for this chunk
      await deleteChunkSpeakers(user.uid, sessionId, chunkFileName)

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
  }

  const deleteChunk = async (chunkPath: string, chunkIndex: number) => {
    if (!user?.uid) return

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
      await deleteChunkTranscript(user.uid, sessionId, chunkFileName)
      
      // Delete speaker data for this chunk
      await deleteChunkSpeakers(user.uid, sessionId, chunkFileName)

      // Update session to remove this chunk
      const updatedChunks = session?.audioChunks?.filter((_, index) => index !== chunkIndex) || []
      const totalDuration = updatedChunks.reduce((sum, chunk) => sum + (chunk.duration || 0), 0)

      await updateSession(user.uid, sessionId, {
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
  }

  const deleteAllAudioAndTranscripts = async () => {
    if (!user?.uid) return

    setIsDeleting(true)
    try {
      // Delete audio files from Firebase Storage
      if (session?.audioChunks && session.audioChunks.length > 0) {
        const deletePromises = session.audioChunks.map(async (chunk) => {
          if (chunk.path) {
            const audioRef = ref(storage, chunk.path)
            try {
              await deleteObject(audioRef)
              console.log(`[v0] Deleted audio file: ${chunk.path}`)
            } catch (error) {
              console.warn(`[v0] Could not delete audio file ${chunk.path}:`, error)
            }
          }
        })
        await Promise.all(deletePromises)
      }

      // Delete all transcripts for this session
      if (chunkTranscripts.length > 0) {
        const transcriptDeletePromises = chunkTranscripts.map(async (transcript) => {
          if (transcript.id) {
            try {
              await deleteDoc(doc(db, "transcripts", transcript.id))
              console.log(`[v0] Deleted transcript: ${transcript.id}`)
            } catch (error) {
              console.warn(`[v0] Could not delete transcript ${transcript.id}:`, error)
            }
          }
        })
        await Promise.all(transcriptDeletePromises)
      }

      // Delete all speakers for this session
      if (speakers.length > 0) {
        const speakerDeletePromises = speakers.map(async (speaker) => {
          if (speaker.id) {
            try {
              await deleteDoc(doc(db, "speakers", speaker.id))
              console.log(`[v0] Deleted speaker: ${speaker.id}`)
            } catch (error) {
              console.warn(`[v0] Could not delete speaker ${speaker.id}:`, error)
            }
          }
        })
        await Promise.all(speakerDeletePromises)
      }

      // Update session to clear audio chunks and reset status
      const updateData: any = {
        audioChunks: [],
        duration: 0,
        transcriptStatus: "none",
        summaryStatus: "none",
        status: "draft",
        updatedAt: new Date(),
      }

      // Remove audioFilePath if it exists
      if (session?.audioFilePath) {
        updateData.audioFilePath = deleteField()
      }

      await updateSession(user.uid, sessionId, updateData)

      // Reload session data
      await loadSessionData()

      toast({
        title: "Audio and transcripts deleted",
        description: "All audio files, transcripts, and speaker data have been removed from this session.",
      })

      setShowDeleteDialog(false)
    } catch (error) {
      console.error("[v0] Error deleting audio and transcripts:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete audio and transcripts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handles manual reprocessing of a specific audio chunk.
   *
   * This calls the reprocessAudio Firebase Function (HTTPS callable) to retry transcription.
   *
   * When to use:
   * - The automatic onAudioUpload function failed to process the chunk
   * - The transcript quality is poor and needs regeneration
   * - You want to update the transcript with different settings
   *
   * How it works:
   * 1. Calls the reprocessAudio Firebase Function with chunk details
   * 2. The function downloads the audio from Storage
   * 3. Sends it to AssemblyAI for transcription
   * 4. Updates the transcript document in Firestore at:
   *    users/{uid}/sessions/{sessionId}/transcripts/{chunkFileName}
   * 5. Client reloads the session data to show updated transcript
   */
  const handleReprocessChunk = async (chunkFileName: string) => {
    if (!user?.uid) return

    setReprocessingChunks((prev) => new Set(prev).add(chunkFileName))

    try {
      // Delete existing transcript and speaker data for this chunk
      await Promise.all([
        deleteChunkTranscript(user.uid, sessionId, chunkFileName),
        deleteChunkSpeakers(user.uid, sessionId, chunkFileName)
      ])
      
      console.log(`[v0] Deleted existing transcript and speaker data for chunk ${chunkFileName}`)

      // Log reprocessing chunk
      console.log(`[v0] Reprocessing chunk ${chunkFileName}`)

      const result = await reprocessAudio({
        uid: user.uid,
        sessionId,
        chunkFileName,
      })

      toast({
        title: "Reprocessing started",
        description: `Chunk ${chunkFileName} is being reprocessed. Previous transcript and speaker data has been cleared.`,
      })

      setTimeout(() => {
        loadSessionData()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error reprocessing chunk:", error)
      toast({
        title: "Reprocessing failed",
        description: error instanceof Error ? error.message : "Failed to reprocess audio chunk",
        variant: "destructive",
      })
    } finally {
      setReprocessingChunks((prev) => {
        const next = new Set(prev)
        next.delete(chunkFileName)
        return next
      })
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <div className="text-[#EDEDEE]">Loading session...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#101010] pb-24">
      <header className="border-b border-[#A3A3A3]/20 bg-[#1D1D1D] sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button asChild variant="ghost" size="icon" className="text-[#EDEDEE] hover:bg-[#101010] shrink-0">
              <Link href="/app">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] h-9"
                  autoFocus
                />
                <Button
                  onClick={handleSaveTitle}
                  size="sm"
                  className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white shrink-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-[#EDEDEE] truncate">{session.title}</h1>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#EDEDEE] hover:bg-[#101010] shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1D1D1D] border-[#A3A3A3]/20">
              <DropdownMenuItem
                onClick={() => setIsEditingTitle(true)}
                className="text-[#EDEDEE] focus:bg-[#101010] focus:text-[#EDEDEE]"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowRestartDialog(true)}
                className="text-[#EEA232] focus:bg-[#101010] focus:text-[#EEA232]"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart Session
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-[#EF4444] focus:bg-[#101010] focus:text-[#EF4444]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-4">
          <Badge
            className={
              session.status === "draft"
                ? "bg-[#A3A3A3] text-white"
                : session.status === "active"
                  ? "bg-[#22C55E] text-white"
                  : "bg-[#EF4444] text-white"
            }
          >
            {session.status === "draft" ? "Draft" : session.status === "active" ? "Active" : "Ended"}
          </Badge>
        </div>

        {session.status !== "ended" && (
          <>
            {!session?.audioChunks?.length && !audioRecorder.isRecording && (
              <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-[#EDEDEE]">Start Recording</CardTitle>
                  <CardDescription className="text-[#A3A3A3]">Begin recording your session</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={startRecording}
                    className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white h-14"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </Button>
                </CardContent>
              </Card>
            )}

            {session?.audioChunks && session.audioChunks.length > 0 && !audioRecorder.isRecording && (
              <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-[#EDEDEE]">Recording Options</CardTitle>
                  <CardDescription className="text-[#A3A3A3]">
                    Continue from where you left off or start fresh
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setShowContinueDialog(true)}
                    className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white h-14"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Continue Recording
                  </Button>
                  <Button
                    onClick={() => setShowRestartDialog(true)}
                    variant="outline"
                    className="border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10 h-14"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Restart Recording
                  </Button>
                </CardContent>
              </Card>
            )}

            {audioRecorder.isRecording && (
              <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-[#EDEDEE]">Recording in Progress</CardTitle>
                  <CardDescription className="text-[#A3A3A3]">
                    {isContinuingRecording
                      ? `Continuing from chunk ${nextChunkIndex}`
                      : "Your session is being recorded"}
                    <br />
                    <span className="text-xs text-[#6B7280]">
                      Platform: {audioRecorder.platform} • Native: {audioRecorder.isNative ? 'Yes' : 'No'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="h-3 w-3 rounded-full bg-[#F94933] animate-pulse" />
                    <span className="text-2xl font-mono text-[#EDEDEE]">{formatTime(audioRecorder.recordingTime)}</span>
                    {audioRecorder.chunks.length > 0 && (
                      <span className="text-sm text-[#A3A3A3]">
                        ({(session?.audioChunks?.length || 0) + audioRecorder.chunks.length} chunks)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {!audioRecorder.isPaused ? (
                      <Button
                        onClick={audioRecorder.pauseRecording}
                        className="bg-[#EEA232] hover:bg-[#EEA232]/90 text-white h-12"
                      >
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={audioRecorder.resumeRecording}
                        className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white h-12"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={stopRecording} className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white h-12">
                      <Square className="mr-2 h-5 w-5" />
                      Stop
                    </Button>
                  </div>
                  <p className="text-center text-[#A3A3A3] text-sm">
                    Recording in 5-minute chunks for optimal processing
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {session.status === "ended" && (
          <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
            <CardHeader>
              <CardTitle className="text-[#EDEDEE]">Session Ended</CardTitle>
              <CardDescription className="text-[#A3A3A3]">
                This session has been marked as complete. No more recordings can be made.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {session.status === "active" && !audioRecorder.isRecording && (
          <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
            <CardHeader>
              <CardTitle className="text-[#EDEDEE]">Session Actions</CardTitle>
              <CardDescription className="text-[#A3A3A3]">
                Manage your session recording and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setShowEndSessionDialog(true)}
                variant="outline"
                className="w-full border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 h-12"
              >
                End Session
              </Button>
              {(session?.audioChunks?.length || 0) > 0 && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="w-full border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 h-12"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Audio & Transcripts
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#EDEDEE] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players
                </CardTitle>
                <CardDescription className="text-[#A3A3A3]">Manage who attended this session</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    const granted = await requestNotificationPermission()
                    setNotificationsEnabled(granted)
                    if (granted) {
                      toast({
                        title: "Notifications enabled",
                        description: "You'll receive notifications when audio processing completes",
                      })
                    } else {
                      toast({
                        title: "Notifications disabled",
                        description: "You can enable notifications in your device settings",
                        variant: "destructive",
                      })
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className={`${notificationsEnabled ? "border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10" : "border-[#A3A3A3] text-[#A3A3A3] hover:bg-[#A3A3A3]/10"}`}
                >
                  {notificationsEnabled ? "🔔 Enabled" : "🔕 Enable"}
                </Button>
                <Button
                  onClick={() => setIsEditingPlayers(!isEditingPlayers)}
                  variant="outline"
                  size="sm"
                  className="border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10"
                >
                  {isEditingPlayers ? "Done" : "Manage"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign && campaign.players.length > 0 && (
              <div>
                <h3 className="text-[#A3A3A3] text-sm font-medium mb-2">Campaign Players</h3>
                <div className="space-y-2">
                  {campaign.players.map((player, idx) => {
                    const isAbsent = absentPlayers.includes(player.playerName)
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded ${
                          isAbsent ? "bg-[#101010]/50 opacity-50" : "bg-[#101010]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={isAbsent ? "bg-[#A3A3A3] text-white" : "bg-[#F94933] text-white"}>
                            {player.playerName}
                          </Badge>
                          {player.characterName && (
                            <span className="text-[#EDEDEE] text-sm">as {player.characterName}</span>
                          )}
                          {isAbsent && <span className="text-[#A3A3A3] text-xs italic">(absent)</span>}
                        </div>
                        {isEditingPlayers && (
                          <Button
                            onClick={() => toggleCampaignPlayer(player.playerName)}
                            variant="outline"
                            size="sm"
                            className={
                              isAbsent
                                ? "border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10 h-8"
                                : "border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 h-8"
                            }
                          >
                            {isAbsent ? "Mark Present" : "Mark Absent"}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[#A3A3A3] text-sm font-medium mb-2">Session Guests</h3>
              {sessionPlayers.length > 0 ? (
                <div className="space-y-2">
                  {sessionPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#101010] p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#8B5CF6] text-white">{player.playerName}</Badge>
                        {player.characterName && (
                          <span className="text-[#EDEDEE] text-sm">as {player.characterName}</span>
                        )}
                      </div>
                      {isEditingPlayers && (
                        <Button
                          onClick={() => removeSessionPlayer(player.playerName)}
                          variant="ghost"
                          size="sm"
                          className="text-[#EF4444] hover:bg-[#EF4444]/10 h-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#A3A3A3] text-sm italic">No session-specific guests</p>
              )}

              {isEditingPlayers && (
                <div className="mt-3 space-y-2 pt-3 border-t border-[#A3A3A3]/20">
                  <Label className="text-[#EDEDEE] text-sm">Add Session Guest</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newSessionPlayerName}
                      onChange={(e) => setNewSessionPlayerName(e.target.value)}
                      placeholder="Player name"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] h-9 text-sm"
                    />
                    <Input
                      value={newSessionCharacterName}
                      onChange={(e) => setNewSessionCharacterName(e.target.value)}
                      placeholder="Character name"
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] h-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={addSessionPlayer}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Guest
                    </Button>
                    <Button
                      onClick={saveSessionPlayers}
                      size="sm"
                      className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#1D1D1D] mb-6">
            <TabsTrigger value="notes" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
              Notes
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
              Audio
            </TabsTrigger>
            <TabsTrigger value="transcript" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
              Transcript
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
              <CardHeader>
                <CardTitle className="text-[#EDEDEE]">Session Notes</CardTitle>
                <CardDescription className="text-[#A3A3A3]">Add your own notes and observations</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your notes here..."
                  className="min-h-[300px] bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3]"
                />
                <Button className="mt-4 bg-[#F94933] hover:bg-[#F94933]/90 text-white">Save Notes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio">
            <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
              <CardHeader>
                <CardTitle className="text-[#EDEDEE]">Recordings</CardTitle>
                <CardDescription className="text-[#A3A3A3]">
                  {session.audioChunks && session.audioChunks.length > 0
                    ? `${session.audioChunks.length} recording(s) • Total duration: ${formatDuration(session.duration)}`
                    : "No recordings available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {session.audioChunks && session.audioChunks.length > 0 ? (
                  <div className="space-y-4">
                    {session.audioChunks.map((chunk, index) => {
                      const transcriptionStatus = getChunkTranscriptionStatus(chunk.path)
                      const isCurrentlyPlaying = playingChunkIndex === index
                      
                      return (
                        <div key={index} className="border border-[#A3A3A3]/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-[#EDEDEE] font-medium">Recording {index + 1}</h3>
                              <p className="text-[#A3A3A3] text-sm">
                                Chunk {index + 1} of {session.audioChunks?.length || 0}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#F94933] text-white">
                                {chunk.duration ? formatDuration(chunk.duration) : "Unknown duration"}
                              </Badge>
                              <Badge 
                                className={
                                  transcriptionStatus.status === 'completed' 
                                    ? "bg-[#22C55E] text-white" 
                                    : transcriptionStatus.status === 'processing'
                                    ? "bg-[#F59E0B] text-white"
                                    : transcriptionStatus.status === 'unprocessed'
                                    ? "bg-[#6B7280] text-white"
                                    : "bg-[#EF4444] text-white"
                                }
                              >
                                {transcriptionStatus.status === 'completed' ? 'Transcribed' : 
                                 transcriptionStatus.status === 'processing' ? 'Processing' : 
                                 transcriptionStatus.status === 'unprocessed' ? 'Unprocessed' : 'Failed'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => toggleChunkPlayPause(index, chunk.path)}
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
                                onClick={() => processChunk(chunk.path)}
                                size="sm"
                                disabled={processingChunks.has(chunk.path)}
                                className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                              >
                                {processingChunks.has(chunk.path) ? "Processing..." : "Process"}
                              </Button>
                            )}

                            {transcriptionStatus.status === 'completed' && (
                              <Button
                                onClick={() => reprocessChunk(chunk.path)}
                                size="sm"
                                disabled={reprocessingChunks.has(chunk.path)}
                                className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
                              >
                                {reprocessingChunks.has(chunk.path) ? "Reprocessing..." : "Reprocess"}
                              </Button>
                            )}

                            {transcriptionStatus.status === 'error' && (
                              <Button
                                onClick={() => processChunk(chunk.path)}
                                size="sm"
                                disabled={processingChunks.has(chunk.path)}
                                className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white"
                              >
                                {processingChunks.has(chunk.path) ? "Processing..." : "Retry"}
                              </Button>
                            )}

                            <Button
                              onClick={() => deleteChunk(chunk.path, index)}
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
                              <p className="text-xs">
                                Transcription: {transcriptionStatus.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Combined playback option */}
                    {session.audioChunks.length > 1 && (
                      <div className="border-t border-[#A3A3A3]/20 pt-4 mt-6">
                        <div className="flex flex-col items-center gap-4">
                          <h3 className="text-[#EDEDEE] font-medium">Play All Recordings</h3>
                          <Button
                            onClick={togglePlayPause}
                            size="lg"
                            className="bg-[#F94933] hover:bg-[#F94933]/90 text-white h-16 w-16 rounded-full"
                          >
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                          </Button>
                          <p className="text-[#A3A3A3] text-sm">
                            {isPlaying ? "Playing all recordings..." : "Click to play all recordings in sequence"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#A3A3A3] mb-4">No audio recordings available</p>
                    <p className="text-[#A3A3A3] text-sm">
                      Recordings will appear here once you start recording your session
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript">
            <div className="space-y-6">
              {/* Transcript Content */}
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
                      <div key={chunkTranscript.id} className="border border-[#A3A3A3]/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[#EEA232] font-semibold">{chunkTranscript.chunkFileName}</h3>
                            <p className="text-[#A3A3A3] text-sm">
                              {chunkTranscript.speakers?.length || 0} speaker(s) detected
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleReprocessChunk(chunkTranscript.chunkFileName)}
                              disabled={reprocessingChunks.has(chunkTranscript.chunkFileName)}
                              variant="outline"
                              size="sm"
                              className="border-[#EEA232] text-[#EEA232] hover:bg-[#EEA232]/10"
                            >
                              {reprocessingChunks.has(chunkTranscript.chunkFileName) ? "Processing..." : "Reprocess"}
                            </Button>
                            <Button
                              onClick={() => deleteTranscriptChunk(chunkTranscript.chunkFileName)}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#A3A3A3] py-8">
                    Transcripts will appear here once audio chunks are processed
                  </p>
                )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
              <CardHeader>
                <CardTitle className="text-[#EDEDEE]">Summary</CardTitle>
                <CardDescription className="text-[#A3A3A3]">
                  {summary ? "AI-generated session summary" : "No summary available yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-[#EDEDEE] leading-relaxed whitespace-pre-wrap">{summary.text}</p>
                  </div>
                ) : (
                  <p className="text-center text-[#A3A3A3] py-8">
                    Summary will be generated after transcript is complete
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1D1D1D] border-t border-[#A3A3A3]/20 p-4 md:hidden">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={togglePlayPause}
              size="lg"
              className="bg-[#F94933] hover:bg-[#F94933]/90 text-white h-12 w-12 rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <span className="text-[#EDEDEE] text-sm">{isPlaying ? "Playing" : "Paused"}</span>
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EDEDEE]">Delete Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              This action cannot be undone. This will permanently delete your session and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EDEDEE]">Restart Recording?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              This will delete all existing audio chunks and start a fresh recording from the beginning. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={restartRecording} className="bg-[#EEA232] hover:bg-[#EEA232]/90 text-white">
              Restart Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EDEDEE]">Continue Recording?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              This will add new audio chunks to your existing recording, starting from chunk {nextChunkIndex}. Your
              previous audio will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={continueRecording} className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
              Continue Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EDEDEE]">End Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              This will mark the session as complete. You will no longer be able to record audio for this session. You
              can still view and edit notes, transcripts, and summaries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EDEDEE]">Delete All Audio & Transcripts?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              This will permanently delete all audio files, transcripts, and speaker data for this session. 
              This action cannot be undone. The session will be reset to draft status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteAllAudioAndTranscripts} 
              disabled={isDeleting}
              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SessionDetailPage() {
  return (
    <AuthGuard>
      <SessionDetailContent />
    </AuthGuard>
  )
}
