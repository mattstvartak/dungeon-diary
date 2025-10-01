"use client"

import { useEffect } from "react"
import { initializeCapacitor, cleanupCapacitor } from "@/lib/capacitor"

export function CapacitorInit() {
  useEffect(() => {
    initializeCapacitor()

    return () => {
      cleanupCapacitor()
    }
  }, [])

  return null
}
