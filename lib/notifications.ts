import { LocalNotifications } from "@capacitor/local-notifications"
import { Capacitor } from "@capacitor/core"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import { auth } from "./firebase"

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

/**
 * Request notification permission for Capacitor
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      // For web, use browser notifications
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    // For mobile, use Capacitor Local Notifications
    const result = await LocalNotifications.requestPermissions()
    return result.display === "granted"
  } catch (error) {
    console.error("[v0] Error requesting notification permission:", error)
    return false
  }
}

/**
 * Send a local notification
 */
export async function sendNotification(notification: NotificationPayload): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) {
      // For web, use browser notifications
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || "/icon-192.jpg",
          badge: notification.badge || "/icon-192.jpg",
          data: notification.data,
        })
      }
      return
    }

    // For mobile, use Capacitor Local Notifications
    await LocalNotifications.schedule({
      notifications: [
        {
          title: notification.title,
          body: notification.body,
          id: Date.now(), // Use timestamp as unique ID
          schedule: { at: new Date(Date.now() + 1000) }, // Show immediately
          sound: "default",
          attachments: notification.icon ? [{ id: "icon", url: notification.icon }] : undefined,
          extra: notification.data,
        },
      ],
    })
  } catch (error) {
    console.error("[v0] Error sending notification:", error)
  }
}

/**
 * Set up notification listeners for Capacitor
 */
export function setupNotificationListeners(onNotificationReceived?: (notification: NotificationPayload) => void) {
  if (!Capacitor.isNativePlatform()) {
    console.log("[v0] Not on native platform, skipping notification listeners")
    return
  }

  // Listen for notification actions
  LocalNotifications.addListener("localNotificationActionPerformed", (notification) => {
    console.log("[v0] Notification action performed:", notification)
    
    if (onNotificationReceived) {
      onNotificationReceived({
        title: notification.notification.title || "Notification",
        body: notification.notification.body || "",
        data: notification.notification.extra,
      })
    }
  })

  // Listen for notification received
  LocalNotifications.addListener("localNotificationReceived", (notification) => {
    console.log("[v0] Notification received:", notification)
    
    if (onNotificationReceived) {
      onNotificationReceived({
        title: notification.title || "Notification",
        body: notification.body || "",
        data: notification.extra,
      })
    }
  })
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true // Capacitor Local Notifications are always supported on native
  }
  return "Notification" in window
}

/**
 * Check if notification permission is granted
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.checkPermissions()
    return result.display === "granted"
  }
  return Notification.permission === "granted"
}
