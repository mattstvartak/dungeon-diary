import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getFunctions } from "firebase/functions"
import { getMessaging, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (typeof window !== "undefined") {
  console.log("[v0] Firebase Config Check:", {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + "...",
  })

  // Validate required config
  const missingVars = []
  if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY")
  if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")
  if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID")

  if (missingVars.length > 0) {
    console.error("[v0] Missing Firebase environment variables:", missingVars)
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, "us-central1")

// Initialize messaging (only in browser)
let messaging: any = null
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}
export { messaging }

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("[v0] Error setting auth persistence:", error)
  })
}
