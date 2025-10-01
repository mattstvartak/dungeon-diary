"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes } from "firebase/storage"

interface AudioRecorderOptions {
  userId: string
  sessionId: string
  chunkDuration?: number // Duration in seconds for each chunk (default: 5 minutes)
  startChunkIndex?: number // Starting chunk index (default: 0)
  onChunkUploaded?: (chunkIndex: number, path: string) => void
  onError?: (error: Error) => void
}

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  currentChunk: number
  chunks: string[] // Array of storage paths
}

export function useAudioRecorder({
  userId,
  sessionId,
  chunkDuration = 300, // 5 minutes default
  startChunkIndex = 0,
  onChunkUploaded,
  onError,
}: AudioRecorderOptions) {
  const sessionIdRef = useRef(sessionId)

  useEffect(() => {
    console.log("[v0] useAudioRecorder sessionId updated:", sessionId)
    sessionIdRef.current = sessionId
  }, [sessionId])

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    currentChunk: startChunkIndex,
    chunks: [],
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null)


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
    if (audioChunksRef.current.length === 0) {
      console.log("[v0] No audio chunks to save")
      return
    }

    console.log("[v0] Saving current chunk, total blobs:", audioChunksRef.current.length)
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" })
    const chunkIndex = state.currentChunk

    // Upload chunk
    await uploadChunk(audioBlob, chunkIndex)

    // Reset for next chunk
    audioChunksRef.current = []
    setState((prev) => ({
      ...prev,
      currentChunk: prev.currentChunk + 1,
    }))
  }, [state.currentChunk, uploadChunk])

  const startRecording = useCallback(async () => {
    try {
      console.log("[v0] startRecording called in hook")
      console.log("[v0] Current sessionId:", sessionIdRef.current)
      console.log("[v0] Current userId:", userId)
      console.log("[v0] Starting from chunk index:", startChunkIndex)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2, // Stereo audio for better quality
          sampleRate: 44100, // CD quality sample rate
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      console.log("[v0] Microphone access granted")

      streamRef.current = stream

      

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm"
      console.log("[v0] Using MIME type:", mimeType)

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps - good quality for playback
      })

      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log("[v0] Audio data available, size:", e.data.size)
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start(1000) // Collect data every second
      mediaRecorderRef.current = recorder
      console.log("[v0] MediaRecorder started")

      setState({
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        currentChunk: startChunkIndex,
        chunks: [],
      })

      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)

      chunkTimerRef.current = setInterval(() => {
        console.log("[v0] Chunk timer triggered, saving chunk...")
        saveCurrentChunk()
      }, chunkDuration * 1000)

      console.log("[v0] Recording started with chunked upload")
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      onError?.(error as Error)
    }
  }, [chunkDuration, saveCurrentChunk, onError, userId, startChunkIndex])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setState((prev) => ({ ...prev, isPaused: true }))
      console.log("[v0] Recording paused")
    }
  }, [state.isRecording, state.isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)
      setState((prev) => ({ ...prev, isPaused: false }))
      console.log("[v0] Recording resumed")
    }
  }, [state.isRecording, state.isPaused])

  const stopRecording = useCallback(async () => {
    return new Promise<string[]>((resolve) => {
      if (!mediaRecorderRef.current || !state.isRecording) {
        resolve([])
        return
      }

      mediaRecorderRef.current.onstop = async () => {
        // Save the final chunk and wait for it to complete
        await saveCurrentChunk()

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        if (chunkTimerRef.current) {
          clearInterval(chunkTimerRef.current)
          chunkTimerRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
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

        console.log("[v0] Recording stopped, total chunks:", allChunks.length)
        console.log("[v0] Chunk paths:", allChunks)
        resolve(allChunks)
      }

      mediaRecorderRef.current.stop()
    })
  }, [state.isRecording, state.chunks, saveCurrentChunk])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current)
      chunkTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    audioChunksRef.current = []
    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      currentChunk: 0,
      chunks: [],
    })

    console.log("[v0] Recording cancelled")
  }, [])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  }
}
