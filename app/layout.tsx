import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import "@/lib/monaco-environment"
import { CapacitorInit } from "@/components/capacitor-init"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Dungeon Diary",
  description: "Record and manage your tabletop RPG sessions",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dungeon Diary",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.jpg",
    apple: "/icon-192.jpg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#F94933",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <CapacitorInit />
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
        />
        <Analytics />
      </body>
    </html>
  )
}
