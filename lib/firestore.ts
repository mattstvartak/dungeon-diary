import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteField,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Session, User, Transcript, Summary, Speaker, Campaign, ChunkTranscript, TranscriptSegment } from "./types"

// User operations
export async function createUser(uid: string, data: Omit<User, "createdAt">) {
  const userRef = doc(db, "users", uid)
  await updateDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getUser(uid: string) {
  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? (userSnap.data() as User) : null
}

export async function updateUserFCMToken(uid: string, fcmToken: string) {
  const userRef = doc(db, "users", uid)
  await updateDoc(userRef, {
    fcmToken,
    updatedAt: serverTimestamp(),
  })
}

// Session operations
export async function createSession(data: Omit<Session, "id" | "createdAt" | "updatedAt">) {
  const sessionsRef = collection(db, "sessions")
  const docRef = await addDoc(sessionsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getSession(userId: string, sessionId: string) {
  try {
    console.log("[v0] getSession called with userId:", userId, "sessionId:", sessionId)
    
    // Check if user is authenticated
    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    console.log("[v0] Current authenticated user:", currentUser?.uid)
    console.log("[v0] Auth state:", currentUser ? "authenticated" : "not authenticated")
    
    if (!currentUser) {
      throw new Error("User not authenticated")
    }
    
    if (currentUser.uid !== userId) {
      throw new Error(`User ID mismatch: expected ${userId}, got ${currentUser.uid}`)
    }
    
    const sessionRef = doc(db, "sessions", sessionId)
    console.log("[v0] Session document path: sessions/" + sessionId)
    const sessionSnap = await getDoc(sessionRef)
    
    if (sessionSnap.exists()) {
      const data = sessionSnap.data() as Session
      console.log("[v0] Session data userId:", data.userId)
      console.log("[v0] Requested userId:", userId)
      
      // Verify the session belongs to the user
      if (data.userId !== userId) {
        console.log("[v0] Session belongs to different user")
        return null
      }
      return { id: sessionSnap.id, ...data } as Session
    }
    console.log("[v0] Session document does not exist")
    return null
  } catch (error) {
    console.error("[v0] Error in getSession:", error)
    throw error
  }
}

export async function getUserSessions(userId: string) {
  const sessionsRef = collection(db, "sessions")
  const q = query(sessionsRef, where("userId", "==", userId))
  const querySnapshot = await getDocs(q)
  const sessions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[]

  // Sort by createdAt descending on the client side
  return sessions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0
    const bTime = b.createdAt?.toMillis?.() || 0
    return bTime - aTime
  })
}

export async function updateSession(userId: string, sessionId: string, data: Partial<Session>) {
  const sessionRef = doc(db, "sessions", sessionId)
  await updateDoc(sessionRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSession(userId: string, sessionId: string) {
  const sessionRef = doc(db, "sessions", sessionId)
  await deleteDoc(sessionRef)
}

// Transcript operations
export async function createTranscript(data: Omit<Transcript, "id" | "createdAt">) {
  const transcriptsRef = collection(db, "transcripts")
  const docRef = await addDoc(transcriptsRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTranscriptBySessionId(userId: string, sessionId: string) {
  const transcriptsRef = collection(db, "transcripts")
  const q = query(transcriptsRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Transcript
  }
  return null
}

// Summary operations
export async function createSummary(data: Omit<Summary, "id" | "createdAt">) {
  const summariesRef = collection(db, "summaries")
  const docRef = await addDoc(summariesRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getSummaryBySessionId(userId: string, sessionId: string) {
  const summariesRef = collection(db, "summaries")
  const q = query(summariesRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Summary
  }
  return null
}

// Speaker operations
export async function createSpeaker(data: Omit<Speaker, "id">) {
  const speakersRef = collection(db, "speakers")
  const docRef = await addDoc(speakersRef, data)
  return docRef.id
}

export async function getSpeakersBySessionId(userId: string, sessionId: string) {
  const speakersRef = collection(db, "speakers")
  const q = query(speakersRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Speaker[]
}

export async function updateSpeaker(speakerId: string, displayName: string) {
  const speakerRef = doc(db, "speakers", speakerId)
  await updateDoc(speakerRef, { displayName })
}

// Campaign operations
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

function cleanPlayers(players: any[]): any[] {
  return players.map((player) => {
    const cleaned: any = { playerName: player.playerName }
    if (player.characterName !== undefined && player.characterName !== "") {
      cleaned.characterName = player.characterName
    }
    return cleaned
  })
}

export async function createCampaign(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">) {
  const campaignsRef = collection(db, "campaigns")
  const cleanData = {
    ...removeUndefined(data),
    players: cleanPlayers(data.players),
  }
  const docRef = await addDoc(campaignsRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getCampaign(userId: string, campaignId: string) {
  const campaignRef = doc(db, "campaigns", campaignId)
  const campaignSnap = await getDoc(campaignRef)
  if (campaignSnap.exists()) {
    const data = campaignSnap.data() as Campaign
    // Verify the campaign belongs to the user
    if (data.userId !== userId) {
      return null
    }
    return { id: campaignSnap.id, ...data } as Campaign
  }
  return null
}

export async function getUserCampaigns(userId: string) {
  try {
    console.log("[v0] getUserCampaigns called with userId:", userId)
    
    // Check if user is authenticated
    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    console.log("[v0] Current authenticated user:", currentUser?.uid)
    console.log("[v0] Auth state:", currentUser ? "authenticated" : "not authenticated")
    
    if (!currentUser) {
      throw new Error("User not authenticated")
    }
    
    if (currentUser.uid !== userId) {
      throw new Error(`User ID mismatch: expected ${userId}, got ${currentUser.uid}`)
    }
    
    const campaignsRef = collection(db, "campaigns")
    console.log("[v0] Collection path: campaigns")
    const q = query(campaignsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    console.log("[v0] Query snapshot size:", querySnapshot.size)
    console.log("[v0] Query snapshot empty:", querySnapshot.empty)
    console.log("[v0] Query snapshot metadata:", {
      fromCache: querySnapshot.metadata.fromCache,
      hasPendingWrites: querySnapshot.metadata.hasPendingWrites
    })
    
    const campaigns = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("[v0] Campaign doc:", {
        id: doc.id,
        data: data,
        exists: doc.exists()
      })
      return {
        id: doc.id,
        ...data,
      }
    }) as Campaign[]

    console.log("[v0] Mapped campaigns:", campaigns)
    console.log("[v0] Campaigns count:", campaigns.length)

    // Sort by createdAt descending on the client side
    const sortedCampaigns = campaigns.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
    
    console.log("[v0] Sorted campaigns:", sortedCampaigns)
    return sortedCampaigns
  } catch (error) {
    console.error("[v0] Error in getUserCampaigns:", error)
    throw error
  }
}

export async function updateCampaign(userId: string, campaignId: string, data: Partial<Campaign>) {
  const campaignRef = doc(db, "campaigns", campaignId)
  const cleanData = removeUndefined(data)
  if (data.players) {
    cleanData.players = cleanPlayers(data.players)
  }
  await updateDoc(campaignRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCampaign(userId: string, campaignId: string) {
  const campaignRef = doc(db, "campaigns", campaignId)
  await deleteDoc(campaignRef)
}

export async function getCampaignSessions(userId: string, campaignId: string) {
  const sessionsRef = collection(db, "sessions")
  const q = query(sessionsRef, where("userId", "==", userId), where("campaignId", "==", campaignId))
  const querySnapshot = await getDocs(q)
  const sessions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[]

  // Sort by createdAt descending on the client side
  return sessions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0
    const bTime = b.createdAt?.toMillis?.() || 0
    return bTime - aTime
  })
}

// Chunk transcript operations for Firebase Functions integration
export async function getChunkTranscriptsBySessionId(userId: string, sessionId: string) {
  const transcriptsRef = collection(db, "transcripts")
  const q = query(transcriptsRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ChunkTranscript[]
}

/**
 * Get speakers for a session
 * These are created by the onAudioUpload Firebase Function
 */
export async function getSessionSpeakers(userId: string, sessionId: string) {
  const speakersRef = collection(db, "speakers")
  const q = query(speakersRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    speakerLabel: doc.id,
    ...doc.data(),
  })) as Speaker[]
}

/**
 * Get all transcripts for a session grouped by speaker
 */
export async function getSessionTranscriptsBySpeaker(userId: string, sessionId: string) {
  const transcriptsRef = collection(db, "transcripts")
  const q = query(transcriptsRef, where("userId", "==", userId), where("sessionId", "==", sessionId))
  const querySnapshot = await getDocs(q)
  
  const transcripts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ChunkTranscript[]

  // Group segments by speaker
  const speakerGroups: { [speaker: string]: TranscriptSegment[] } = {}
  
  transcripts.forEach(transcript => {
    transcript.segments.forEach(segment => {
      if (!speakerGroups[segment.speaker]) {
        speakerGroups[segment.speaker] = []
      }
      speakerGroups[segment.speaker].push(segment)
    })
  })

  // Sort segments by start time within each speaker group
  Object.keys(speakerGroups).forEach(speaker => {
    speakerGroups[speaker].sort((a, b) => a.startTime - b.startTime)
  })

  return speakerGroups
}

/**
 * Delete transcript data for a specific chunk
 */
export async function deleteChunkTranscript(userId: string, sessionId: string, chunkFileName: string) {
  const transcriptsRef = collection(db, "transcripts")
  const q = query(
    transcriptsRef,
    where("userId", "==", userId),
    where("sessionId", "==", sessionId),
    where("chunkFileName", "==", chunkFileName)
  )
  const querySnapshot = await getDocs(q)
  
  // Delete all matching transcript documents
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
  
  console.log(`[v0] Deleted ${querySnapshot.docs.length} transcript document(s) for chunk ${chunkFileName}`)
}

/**
 * Delete speaker data for a specific chunk
 */
export async function deleteChunkSpeakers(userId: string, sessionId: string, chunkFileName: string) {
  // First get the transcript to find which speakers were associated with this chunk
  const transcriptsRef = collection(db, "transcripts")
  const q = query(
    transcriptsRef,
    where("userId", "==", userId),
    where("sessionId", "==", sessionId),
    where("chunkFileName", "==", chunkFileName)
  )
  const querySnapshot = await getDocs(q)
  
  // Collect all unique speakers from this chunk
  const speakersToDelete = new Set<string>()
  querySnapshot.docs.forEach(doc => {
    const data = doc.data()
    if (data.speakers && Array.isArray(data.speakers)) {
      data.speakers.forEach((speaker: string) => {
        speakersToDelete.add(speaker)
      })
    }
  })
  
  // Delete speaker documents for this session and chunk
  const speakerDeletePromises = Array.from(speakersToDelete).map(speakerLabel => {
    const speakerDocRef = doc(db, "speakers", `${sessionId}_${speakerLabel}`)
    return deleteDoc(speakerDocRef).catch(error => {
      console.log(`[v0] Speaker ${speakerLabel} may not exist, skipping deletion:`, error.message)
    })
  })
  
  await Promise.all(speakerDeletePromises)
  
  console.log(`[v0] Deleted ${speakersToDelete.size} speaker document(s) for chunk ${chunkFileName}:`, Array.from(speakersToDelete))
}
