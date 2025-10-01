"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function SplashScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.push("/app")
        } else {
          router.push("/auth")
        }
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#F94933] animate-pulse">Dungeon Diary</h1>
        <p className="mt-4 text-lg text-[#EEA232]">Your Adventure Awaits...</p>
      </div>
    </div>
  )
}
