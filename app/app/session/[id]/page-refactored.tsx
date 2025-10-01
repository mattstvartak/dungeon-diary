"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { useSessionData } from "@/hooks/use-session-data"
import { processAudio, reprocessAudio } from "@/lib/functions"
import { requestNotificationPermission, sendNotification, setupNotificationListeners, hasNotificationPermission } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import { toast as sonnerToast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useHybridAudioRecorder } from "@/hooks/use-hybrid-audio-recorder"

// Import new components
import { SessionHeader } from "@/components/session/SessionHeader"
import { PlayersCard } from "@/components/session/PlayersCard"
import { SessionActionsCard } from "@/components/session/SessionActionsCard"
import { RecordingCard } from "@/components/session/RecordingCard"
import { AudioTab } from "@/components/session/AudioTab"
import { TranscriptTab } from "@/components/session/TranscriptTab"
import { SummaryTab } from "@/components/session/SummaryTab"

import type { Player, AudioChunkStatus } from "@/lib/types"

function SessionDetailContent() {
  const params = useParams()
  const sessionId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Use custom hook for session data
  const {
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
    loadSessionData,
    updateSessionTitle,
    saveNotes,
    deleteChunk,
    deleteTranscriptChunk,
    setNotes,
  } = useSessionData(sessionId, user?.uid)

  // Audio recording state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [playingChunkIndex, setPlayingChunkIndex] = useState<number | null>(null)
  const [chunkAudioElements, setChunkAudioElements] = useState<Map<number, HTMLAudioElement>>(new Map())

  // Player management state
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([])
  const [isEditingPlayers, setIsEditingPlayers] = useState(false)
  const [absentPlayers, setAbsentPlayers] = useState<string[]>([])
  const [newSessionPlayerName, setNewSessionPlayerName] = useState("")
  const [newSessionCharacterName, setNewSessionCharacterName] = useState("")

  // Dialog states
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [isContinuingRecording, setIsContinuingRecording] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Processing states
  const [reprocessingChunks, setReprocessingChunks] = useState<Set<string>>(new Set())
  const [processingChunks, setProcessingChunks] = useState<Set<string>>(new Set())
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const nextChunkIndex = session?.audioChunks?.length || 0

  const audioRecorder = useHybridAudioRecorder({
    userId: user?.uid || "",
    sessionId,
    startChunkIndex: nextChunkIndex,
    onChunkUploaded: async (chunkIndex, path) => {
      console.log(`[v0] Chunk ${chunkIndex} uploaded: ${path}`)
      await loadSessionData()
    },
    onError: (error) => {
      console.error("[v0] Audio recording error:", error)
      toast({
        title: "Recording Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

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

        setupNotificationListeners((notification) => {
          console.log("[v0] Notification received:", notification)
          if (notification.data?.sessionId === sessionId) {
            loadSessionData()
          }
        })
      } catch (error) {
        console.error("[v0] Error initializing notifications:", error)
      }
    }

    initializeNotifications()
  }, [sessionId, loadSessionData])

  // Initialize session players from campaign
  useEffect(() => {
    if (campaign?.players) {
      setSessionPlayers(campaign.players)
    }
  }, [campaign])

  // Audio playback functions
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
        const { ref, getDownloadURL } = await import("firebase/storage")
        const { storage } = await import("@/lib/firebase")
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
      return { status: 'error' as const, message: 'No path available' }
    }

    const chunk = session?.audioChunks?.find(c => c.path === chunkPath)
    if (!chunk) {
      return { status: 'error' as const, message: 'Chunk not found' }
    }

    const status = chunk.status || 'unprocessed'
    const transcript = chunkTranscripts.find(t => t.chunkFileName === chunkPath.split('/').pop())

    if (status === 'completed' && transcript) {
      return { status: 'completed' as const, message: 'Transcription complete' }
    } else if (status === 'processing') {
      return { status: 'processing' as const, message: 'Processing in progress' }
    } else if (status === 'error') {
      return { status: 'error' as const, message: 'Processing failed' }
    } else {
      return { status: 'unprocessed' as const, message: 'Ready for processing' }
    }
  }

  // Processing functions
  const processChunk = async (chunkPath: string) => {
    if (!user?.uid || !session) return

    const chunkFileName = chunkPath.split('/').pop() || ''
    setProcessingChunks(prev => new Set(prev).add(chunkPath))

    try {
      const result = await processAudio({
        uid: user.uid,
        sessionId,
        chunkFileName,
      })

      if (result.ok) {
        // Update chunk status
        const updatedChunks = session.audioChunks?.map(chunk => 
          chunk.path === chunkPath 
            ? { ...chunk, status: 'completed' as AudioChunkStatus }
            : chunk
        ) || []

        await loadSessionData()

        // Send notifications
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

        toast({
          title: "Processing complete",
          description: "Audio chunk has been transcribed successfully",
        })

        sonnerToast.success("Audio Processing Complete", {
          description: `Your audio chunk ${chunkFileName} has been transcribed successfully.`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("[v0] Error processing chunk:", error)
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process audio chunk",
        variant: "destructive",
      })
    } finally {
      setProcessingChunks(prev => {
        const next = new Set(prev)
        next.delete(chunkPath)
        return next
      })
    }
  }

  const reprocessChunk = async (chunkPath: string) => {
    if (!user?.uid || !session) return

    const chunkFileName = chunkPath.split('/').pop() || ''
    setReprocessingChunks(prev => new Set(prev).add(chunkPath))

    try {
      const result = await reprocessAudio({
        uid: user.uid,
        sessionId,
        chunkFileName,
      })

      if (result.ok) {
        await loadSessionData()

        // Send notifications
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

        toast({
          title: "Reprocessing complete",
          description: "Audio chunk has been re-transcribed successfully",
        })

        sonnerToast.success("Audio Reprocessing Complete", {
          description: `Your audio chunk ${chunkFileName} has been re-transcribed successfully.`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("[v0] Error reprocessing chunk:", error)
      toast({
        title: "Reprocessing failed",
        description: error instanceof Error ? error.message : "Failed to reprocess audio chunk",
        variant: "destructive",
      })
    } finally {
      setReprocessingChunks(prev => {
        const next = new Set(prev)
        next.delete(chunkPath)
        return next
      })
    }
  }

  const handleReprocessChunk = async (chunkFileName: string) => {
    if (!user?.uid) return

    setReprocessingChunks(prev => new Set(prev).add(chunkFileName))

    try {
      // Delete existing transcript and speaker data for this chunk
      const { deleteChunkTranscript, deleteChunkSpeakers } = await import("@/lib/firestore")
      await Promise.all([
        deleteChunkTranscript(user.uid, sessionId, chunkFileName),
        deleteChunkSpeakers(user.uid, sessionId, chunkFileName)
      ])
      
      console.log(`[v0] Deleted existing transcript and speaker data for chunk ${chunkFileName}`)
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
      setReprocessingChunks(prev => {
        const next = new Set(prev)
        next.delete(chunkFileName)
        return next
      })
    }
  }

  // Player management functions
  const addSessionPlayer = () => {
    if (newSessionPlayerName.trim()) {
      const newPlayer: Player = {
        playerName: newSessionPlayerName.trim(),
        characterName: newSessionCharacterName.trim() || undefined,
      }
      setSessionPlayers([...sessionPlayers, newPlayer])
      setNewSessionPlayerName("")
      setNewSessionCharacterName("")
    }
  }

  const removeSessionPlayer = (playerName: string) => {
    setSessionPlayers(sessionPlayers.filter(p => 
      (p.characterName || p.playerName) !== playerName
    ))
  }

  const toggleCampaignPlayer = (playerName: string) => {
    if (absentPlayers.includes(playerName)) {
      setAbsentPlayers(absentPlayers.filter(name => name !== playerName))
    } else {
      setAbsentPlayers([...absentPlayers, playerName])
    }
  }

  // Session actions
  const handleEndSession = async () => {
    if (!user?.uid || !session) return

    try {
      const { updateSession } = await import("@/lib/firestore")
      await updateSession(user.uid, sessionId, {
        status: "completed",
        updatedAt: new Date(),
      })

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

  const deleteAllAudioAndTranscripts = async () => {
    if (!user?.uid || !session) return

    setIsDeleting(true)
    try {
      const { deleteObject } = await import("firebase/storage")
      const { storage } = await import("@/lib/firebase")
      const { deleteDoc, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      const { updateSession, deleteField } = await import("@/lib/firestore")

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

  // Recording functions
  const startRecording = async () => {
    if (!user?.uid || !session) return

    try {
      await audioRecorder.startRecording()
      
      // Update session status to active
      const { updateSession } = await import("@/lib/firestore")
      await updateSession(user.uid, sessionId, {
        status: "active",
        updatedAt: new Date(),
      })

      await loadSessionData()
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive",
      })
    }
  }

  const stopRecording = async () => {
    if (!user?.uid || !session) return

    try {
      const allChunks = await audioRecorder.stopRecording()
      console.log("[v0] Recording stopped, all chunks:", allChunks)
      console.log("[v0] All chunks length:", allChunks.length)
      console.log("[v0] Recording time:", audioRecorder.recordingTime)

      if (allChunks.length > 0) {
        // Update session with new chunks
        const { updateSession } = await import("@/lib/firestore")
        const chunks = allChunks.map((path, index) => ({
          path,
          duration: audioRecorder.recordingTime / allChunks.length,
          uploadedAt: new Date(),
          status: "unprocessed" as AudioChunkStatus,
        }))

        const existingChunks = session.audioChunks || []
        const updatedChunks = [...existingChunks, ...chunks]
        const totalDuration = updatedChunks.reduce((sum, chunk) => sum + (chunk.duration || 0), 0)

        await updateSession(user.uid, sessionId, {
          audioChunks: updatedChunks,
          duration: totalDuration,
          updatedAt: new Date(),
        })

        await loadSessionData()

        toast({
          title: "Recording saved",
          description: `${allChunks.length} audio chunk(s) have been uploaded and are ready for processing.`,
        })
      }
    } catch (error) {
      console.error("[v0] Error stopping recording:", error)
      toast({
        title: "Recording Error",
        description: "Failed to stop recording",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#EDEDEE]">Loading session...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#EDEDEE]">Session not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Session Header */}
        <SessionHeader
          session={session}
          onUpdateTitle={updateSessionTitle}
          onBack={() => router.push("/app")}
        />

        {/* Players Card */}
        <PlayersCard
          campaignPlayers={campaign?.players || []}
          sessionPlayers={sessionPlayers}
          absentPlayers={absentPlayers}
          isEditing={isEditingPlayers}
          onToggleEdit={() => setIsEditingPlayers(!isEditingPlayers)}
          onAddPlayer={addSessionPlayer}
          onRemovePlayer={removeSessionPlayer}
          onToggleAbsent={toggleCampaignPlayer}
        />

        {/* Recording Card */}
        <RecordingCard
          isRecording={audioRecorder.isRecording}
          isPaused={audioRecorder.isPaused}
          recordingTime={audioRecorder.recordingTime}
          chunks={audioRecorder.chunks}
          existingChunks={session.audioChunks?.length || 0}
          isContinuingRecording={isContinuingRecording}
          nextChunkIndex={nextChunkIndex}
          platform={audioRecorder.platform}
          isNative={audioRecorder.isNative}
          onPauseRecording={audioRecorder.pauseRecording}
          onResumeRecording={audioRecorder.resumeRecording}
          onStopRecording={stopRecording}
        />

        {/* Session Actions Card */}
        {session.status === "active" && !audioRecorder.isRecording && (
          <SessionActionsCard
            session={session}
            onEndSession={() => setShowEndSessionDialog(true)}
            onDeleteAll={() => setShowDeleteDialog(true)}
          />
        )}

        {/* Start Recording Button */}
        {session.status === "draft" && !audioRecorder.isRecording && (
          <div className="mb-6">
            <button
              onClick={startRecording}
              className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Recording Session
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1D1D1D] border-[#A3A3A3]/20">
            <TabsTrigger value="audio" className="text-[#A3A3A3] data-[state=active]:text-[#EDEDEE]">
              Audio
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-[#A3A3A3] data-[state=active]:text-[#EDEDEE]">
              Transcript
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-[#A3A3A3] data-[state=active]:text-[#EDEDEE]">
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio">
            <AudioTab
              audioChunks={session.audioChunks || []}
              duration={session.duration || 0}
              playingChunkIndex={playingChunkIndex}
              processingChunks={processingChunks}
              reprocessingChunks={reprocessingChunks}
              onToggleChunkPlayPause={toggleChunkPlayPause}
              onProcessChunk={processChunk}
              onReprocessChunk={reprocessChunk}
              onDeleteChunk={deleteChunk}
              getChunkTranscriptionStatus={getChunkTranscriptionStatus}
            />
          </TabsContent>

          <TabsContent value="transcript">
            <TranscriptTab
              chunkTranscripts={chunkTranscripts}
              reprocessingChunks={reprocessingChunks}
              onReprocessChunk={handleReprocessChunk}
              onDeleteTranscriptChunk={deleteTranscriptChunk}
            />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryTab
              summary={summary}
              notes={notes}
              onNotesChange={setNotes}
              onSaveNotes={saveNotes}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
          <AlertDialogContent className="bg-[#1D1D1D] border-[#A3A3A3]/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#EDEDEE]">End Session?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#A3A3A3]">
                This will mark the session as complete. You won't be able to record any more audio for this session.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#101010] text-[#EDEDEE] border-[#A3A3A3]/30 hover:bg-[#101010]/80">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEndSession}
                className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white"
              >
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
