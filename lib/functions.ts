import { httpsCallable } from "firebase/functions"
import { functions } from "./firebase"
import { auth } from "./firebase"

export interface ProcessAudioParams {
  uid: string
  sessionId: string
  chunkFileName: string
}

export interface ReprocessAudioParams {
  uid: string
  sessionId: string
  chunkFileName: string
}

export interface ProcessAudioResult {
  ok: boolean
  transcriptId: string
}

export interface ReprocessAudioResult {
  ok: boolean
  transcriptId: string
}

/**
 * Firebase Functions Integration Overview:
 *
 * 1. onAudioUpload (Storage Trigger - AUTOMATIC)
 *    - Runs automatically whenever a new audio chunk is uploaded to:
 *      users/{uid}/sessions/{sessionId}/audio_chunk_xxx.webm
 *    - Downloads the chunk from Storage
 *    - Sends it to AssemblyAI for transcription
 *    - Saves the transcript with diarized speaker labels to Firestore:
 *      users/{uid}/sessions/{sessionId}/transcripts/{chunkFileName}
 *    - Saves detected speakers to:
 *      users/{uid}/sessions/{sessionId}/speakers/{speakerLabel}
 *    - This happens automatically - no client action needed
 *
 * 2. reprocessAudio (HTTPS Callable - MANUAL)
 *    - Called manually from the client when transcription needs to be retried
 *    - Use cases:
 *      • Transcription failed or returned poor results
 *      • User wants to regenerate transcript with updated settings
 *      • Network issues caused incomplete processing
 *    - Takes the same chunk file and reprocesses it through AssemblyAI
 *    - Updates the existing transcript document in Firestore
 */

/**
 * Calls the processAudio Firebase Function to manually process an unprocessed audio chunk.
 *
 * This should be used when:
 * - The automatic transcription didn't run (e.g., upload failed)
 * - The chunk was uploaded but never processed
 * - You want to manually trigger processing for a specific chunk
 *
 * @param params - Object containing uid, sessionId, and chunkFileName
 * @returns Promise with ok status and transcriptId
 *
 * @example
 * ```typescript
 * const result = await processAudio({
 *   uid: user.uid,
 *   sessionId: "abc123",
 *   chunkFileName: "audio_chunk_0.webm"
 * });
 * console.log("Transcript ID:", result.transcriptId);
 * ```
 */
export async function processAudio(params: ProcessAudioParams): Promise<ProcessAudioResult> {
  console.log("[v0] processAudio called with params:", params)
  
  // Get current user and ID token
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error("User not authenticated")
  }
  
  const idToken = await currentUser.getIdToken()
  console.log("[v0] ID token obtained for processAudio:", idToken ? "Yes" : "No")
  
  // Get the function URL
  const functionUrl = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/processAudio`
  console.log("[v0] Function URL:", functionUrl)
  console.log("[v0] Request body:", JSON.stringify({ data: params }))
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ data: params })
    })
    
    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Error response text:", errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    console.log("[v0] processAudio result:", result)
    return result
  } catch (error) {
    console.error("[v0] processAudio error:", error)
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    throw error
  }
}

/**
 * Calls the reprocessAudio Firebase Function to manually retry transcription of a specific chunk.
 *
 * This should be used when:
 * - The automatic transcription failed
 * - The transcript quality is poor and needs regeneration
 * - You want to reprocess with different settings
 *
 * @param params - Object containing uid, sessionId, and chunkFileName
 * @returns Promise with ok status and transcriptId
 *
 * @example
 * ```typescript
 * const result = await reprocessAudio({
 *   uid: user.uid,
 *   sessionId: "abc123",
 *   chunkFileName: "audio_chunk_0.webm"
 * });
 * console.log("Transcript ID:", result.transcriptId);
 * ```
 */
export async function reprocessAudio(params: ReprocessAudioParams): Promise<ReprocessAudioResult> {
  console.log("[v0] reprocessAudio called with params:", params)
  
  // Get current user and ID token
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error("User not authenticated")
  }
  
  const idToken = await currentUser.getIdToken()
  console.log("[v0] ID token obtained for reprocessAudio:", idToken ? "Yes" : "No")
  
  // Get the function URL
  const functionUrl = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/reprocessAudio`
  console.log("[v0] Function URL:", functionUrl)
  console.log("[v0] Request body:", JSON.stringify({ data: params }))
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ data: params })
    })
    
    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Error response text:", errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    console.log("[v0] reprocessAudio result:", result)
    return result
  } catch (error) {
    console.error("[v0] reprocessAudio error:", error)
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    throw error
  }
}
