import { Capacitor } from "@capacitor/core"
import { App } from "@capacitor/app"
import { StatusBar, Style } from "@capacitor/status-bar"
import { SplashScreen } from "@capacitor/splash-screen"
import { Keyboard } from "@capacitor/keyboard"

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform()

// Initialize native features
export async function initializeCapacitor() {
  if (!isNative) return

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: "#000000" })

    // Hide splash screen after app is ready
    await SplashScreen.hide()

    // Handle app state changes
    App.addListener("appStateChange", ({ isActive }) => {
      console.log("[v0] App state changed. Active:", isActive)
    })

    // Handle back button on Android
    App.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })

    // Keyboard event listeners
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open")
    })

    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open")
    })
  } catch (error) {
    console.error("[v0] Error initializing Capacitor:", error)
  }
}

// Cleanup listeners
export async function cleanupCapacitor() {
  if (!isNative) return

  await App.removeAllListeners()
  await Keyboard.removeAllListeners()
}
