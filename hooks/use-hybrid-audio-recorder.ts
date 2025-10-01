"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { useAudioRecorder } from "./use-audio-recorder"
import { useNativeAudioRecorder } from "./use-native-audio-recorder"

interface HybridAudioRecorderOptions {
  userId: string
  sessionId: string
  chunkDuration?: number
  startChunkIndex?: number
  onChunkUploaded?: (chunkIndex: number, path: string) => void
  onError?: (error: Error) => void
}

export function useHybridAudioRecorder(options: HybridAudioRecorderOptions) {
  const isNative = Capacitor.isNativePlatform()
  
  // Use native recorder on mobile, web recorder on web
  const nativeRecorder = useNativeAudioRecorder(options)
  const webRecorder = useAudioRecorder(options)
  
  const activeRecorder = isNative ? nativeRecorder : webRecorder

  return {
    ...activeRecorder,
    isNative,
    platform: isNative ? 'native' : 'web'
  }
}
