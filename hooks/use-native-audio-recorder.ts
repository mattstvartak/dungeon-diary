"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Media } from "@capacitor-community/media"
import { Capacitor } from "@capacitor/core"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes } from "firebase/storage"

interface NativeAudioRecorderOptions {
  userId: string
  sessionId: string
  chunkDuration?: number // Duration in seconds for each chunk (default: 5 minutes)
  startChunkIndex?: number // Starting chunk index (default: 0)
  onChunkUploaded?: (chunkIndex: number, path: string) => void
  onError?: (error: Error) => void
}

interface NativeAudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  currentChunk: number
  chunks: string[] // Array of storage paths
}

export function useNativeAudioRecorder({
  userId,
  sessionId,
  chunkDuration = 300, // 5 minutes default
  startChunkIndex = 0,
  onChunkUploaded,
  onError,
}: NativeAudioRecorderOptions) {
  const sessionIdRef = useRef(sessionId)

  useEffect(() => {
    console.log("[v0] useNativeAudioRecorder sessionId updated:", sessionId)
    sessionIdRef.current = sessionId
  }, [sessionId])

  const [state, setState] = useState<NativeAudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    currentChunk: startChunkIndex,
    chunks: [],
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentRecordingRef = useRef<string | null>(null)

  const uploadChunk = useCallback(
    async (audioBlob: Blob, chunkIndex: number) => {
      try {
        const currentSessionId = sessionIdRef.current
        console.log("[v0] Uploading chunk", chunkIndex, "for session:", currentSessionId)

        if (!currentSessionId) {
          console.error("[v0] Cannot upload chunk: sessionId is empty")
          onError?.(new Error("Session ID is not set"))
          return
        }

        const chunkPath = `users/${userId}/sessions/${currentSessionId}/audio_chunk_${chunkIndex.toString().padStart(3, "0")}.webm`
        const audioRef = ref(storage, chunkPath)
        await uploadBytes(audioRef, audioBlob)

        setState((prev) => ({
          ...prev,
          chunks: [...prev.chunks, chunkPath],
        }))

        onChunkUploaded?.(chunkIndex, chunkPath)
        console.log(`[v0] Uploaded chunk ${chunkIndex}: ${chunkPath}`)
      } catch (error) {
        console.error(`[v0] Error uploading chunk ${chunkIndex}:`, error)
        onError?.(error as Error)
      }
    },
    [userId, onChunkUploaded, onError],
  )

  const saveCurrentChunk = useCallback(async () => {
    if (!currentRecordingRef.current) {
      console.log("[v0] No current recording to save")
      return
    }

    try {
      console.log("[v0] Saving current chunk:", currentRecordingRef.current)
      
      // Get the recorded audio file
      const audioBlob = await fetch(currentRecordingRef.current).then(r => r.blob())
      const chunkIndex = state.currentChunk

      // Upload chunk
      await uploadChunk(audioBlob, chunkIndex)

      // Reset for next chunk
      currentRecordingRef.current = null
      setState((prev) => ({
        ...prev,
        currentChunk: prev.currentChunk + 1,
      }))
    } catch (error) {
      console.error("[v0] Error saving current chunk:", error)
      onError?.(error as Error)
    }
  }, [state.currentChunk, uploadChunk, onError])

  const startRecording = useCallback(async () => {
    try {
      console.log("[v0] startRecording called in native hook")
      console.log("[v0] Current sessionId:", sessionIdRef.current)
      console.log("[v0] Current userId:", userId)
      console.log("[v0] Starting from chunk index:", startChunkIndex)

      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        throw new Error("Native audio recording is only available on mobile devices")
      }

      // Request permissions
      const permissions = await Media.requestPermissions()
      if (!permissions.microphone) {
        throw new Error("Microphone permission denied")
      }

      // Start recording
      const recording = await Media.startRecording({
        audio: true,
        video: false,
        quality: 'high',
        bitrate: 64000, // 64kbps for speech
      })

      currentRecordingRef.current = recording.path
      console.log("[v0] Native recording started:", recording.path)

      setState({
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        currentChunk: startChunkIndex,
        chunks: [],
      })

      // Start timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)

      // Start chunk timer
      chunkTimerRef.current = setInterval(() => {
        console.log("[v0] Chunk timer triggered, saving chunk...")
        saveCurrentChunk()
      }, chunkDuration * 1000)

      console.log("[v0] Native recording started with chunked upload")
    } catch (error) {
      console.error("[v0] Error starting native recording:", error)
      onError?.(error as Error)
    }
  }, [chunkDuration, saveCurrentChunk, onError, userId, startChunkIndex])

  const pauseRecording = useCallback(async () => {
    if (state.isRecording && !state.isPaused) {
      try {
        await Media.pauseRecording()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        setState((prev) => ({ ...prev, isPaused: true }))
        console.log("[v0] Native recording paused")
      } catch (error) {
        console.error("[v0] Error pausing recording:", error)
        onError?.(error as Error)
      }
    }
  }, [state.isRecording, state.isPaused, onError])

  const resumeRecording = useCallback(async () => {
    if (state.isRecording && state.isPaused) {
      try {
        await Media.resumeRecording()
        timerRef.current = setInterval(() => {
          setState((prev) => ({
            ...prev,
            recordingTime: prev.recordingTime + 1,
          }))
        }, 1000)
        setState((prev) => ({ ...prev, isPaused: false }))
        console.log("[v0] Native recording resumed")
      } catch (error) {
        console.error("[v0] Error resuming recording:", error)
        onError?.(error as Error)
      }
    }
  }, [state.isRecording, state.isPaused, onError])

  const stopRecording = useCallback(async () => {
    return new Promise<string[]>((resolve) => {
      if (!state.isRecording) {
        resolve([])
        return
      }

      const stopAndSave = async () => {
        try {
          // Stop the recording
          await Media.stopRecording()
          
          // Save the final chunk
          await saveCurrentChunk()

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          if (chunkTimerRef.current) {
            clearInterval(chunkTimerRef.current)
            chunkTimerRef.current = null
          }

          // Get the current chunks before clearing state
          const allChunks = [...state.chunks]
          
          setState({
            isRecording: false,
            isPaused: false,
            recordingTime: 0,
            currentChunk: 0,
            chunks: [],
          })

          console.log("[v0] Native recording stopped, total chunks:", allChunks.length)
          console.log("[v0] Chunk paths:", allChunks)
          resolve(allChunks)
        } catch (error) {
          console.error("[v0] Error stopping recording:", error)
          onError?.(error as Error)
          resolve([])
        }
      }

      stopAndSave()
    })
  }, [state.isRecording, state.chunks, saveCurrentChunk, onError])

  const cancelRecording = useCallback(async () => {
    try {
      if (state.isRecording) {
        await Media.stopRecording()
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current)
        chunkTimerRef.current = null
      }

      currentRecordingRef.current = null
      setState({
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
        currentChunk: 0,
        chunks: [],
      })

      console.log("[v0] Native recording cancelled")
    } catch (error) {
      console.error("[v0] Error cancelling recording:", error)
      onError?.(error as Error)
    }
  }, [state.isRecording, onError])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  }
}
