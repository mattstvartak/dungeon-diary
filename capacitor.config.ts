import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.dungeondiary.app",
  appName: "Dungeon Diary",
  webDir: ".next/server/app",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
}

export default config
