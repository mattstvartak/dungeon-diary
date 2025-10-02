import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { initializeApp } from "firebase/app"
import { updateUserFCMToken } from "./firestore"
import { auth } from "./firebase"
import { toast as sonnerToast } from "sonner"

// Initialize Firebase app for messaging
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig, "messaging")
const messaging = getMessaging(app)

// VAPID key for web push notifications
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey,
      })
      return token
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting FCM token:", error)
    return null
  }
}

/**
 * Register FCM token for the current user
 */
export async function registerFCMToken(): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("[v0] No authenticated user, skipping FCM token registration")
      return
    }

    const token = await requestNotificationPermission()
    if (token) {
      await updateUserFCMToken(user.uid, token)
      console.log("[v0] FCM token registered for user:", user.uid)
    }
  } catch (error) {
    console.error("[v0] Error registering FCM token:", error)
  }
}

/**
 * Set up message listener for foreground notifications
 */
export function setupMessageListener(): void {
  try {
    onMessage(messaging, (payload) => {
      console.log("[v0] Message received in foreground:", payload)
      
      // Show Sonner toast notification
      if (payload.notification) {
        sonnerToast.success(payload.notification.title || "Notification", {
          description: payload.notification.body,
          duration: 5000,
          action: payload.data?.action === "view_summary" ? {
            label: "View Summary",
            onClick: () => {
              if (payload.data?.sessionId) {
                window.location.href = `/app/session/${payload.data.sessionId}?tab=summary`
              }
            }
          } : undefined,
        })
      }
    })
  } catch (error) {
    console.error("[v0] Error setting up message listener:", error)
  }
}

/**
 * Initialize Firebase messaging for the app
 */
export async function initializeFirebaseMessaging(): Promise<void> {
  try {
    // Only run on client side
    if (typeof window === "undefined") return

    // Register FCM token
    await registerFCMToken()

    // Set up message listener
    setupMessageListener()

    console.log("[v0] Firebase messaging initialized")
  } catch (error) {
    console.error("[v0] Error initializing Firebase messaging:", error)
  }
}
