'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useBreadcrumbEntities() {
  const pathname = usePathname()
  const [entityNames, setEntityNames] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchEntityNames = async () => {
      const pathWithoutApp = pathname.replace(/^\/app\/?/, '')
      const segments = pathWithoutApp.split('/').filter(Boolean)

      const newEntityNames: Record<string, string> = {}

      // Check for campaign IDs
      const campaignIndex = segments.indexOf('campaigns')
      if (campaignIndex !== -1 && segments[campaignIndex + 1]) {
        const campaignId = segments[campaignIndex + 1]
        // Check if it's a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('campaigns')
              .select('name')
              .eq('id', campaignId)
              .single()

            if (!error && data) {
              newEntityNames[campaignId] = data.name
              newEntityNames[`campaigns/${campaignId}`] = data.name
            }
          } catch (err) {
            console.error('Error fetching campaign name:', err)
          }
        }
      }

      // Check for session IDs
      const sessionIndex = segments.indexOf('sessions')
      if (sessionIndex !== -1 && segments[sessionIndex + 1]) {
        const sessionId = segments[sessionIndex + 1]
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('sessions')
              .select('title')
              .eq('id', sessionId)
              .single()

            if (!error && data) {
              newEntityNames[sessionId] = data.title
              newEntityNames[`sessions/${sessionId}`] = data.title
            }
          } catch (err) {
            console.error('Error fetching session name:', err)
          }
        }
      }

      // Check for note IDs
      const noteIndex = segments.indexOf('notes')
      if (noteIndex !== -1 && segments[noteIndex + 1] && segments[noteIndex + 1] !== 'lorebook' && segments[noteIndex + 1] !== 'new') {
        const noteId = segments[noteIndex + 1]
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noteId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('notes')
              .select('title')
              .eq('id', noteId)
              .single()

            if (!error && data) {
              newEntityNames[noteId] = data.title
              newEntityNames[`notes/${noteId}`] = data.title
            }
          } catch (err) {
            console.error('Error fetching note name:', err)
          }
        }
      }

      // Check for NPC IDs
      const npcIndex = segments.indexOf('npcs')
      if (npcIndex !== -1 && segments[npcIndex + 1] && segments[npcIndex + 1] !== 'new') {
        const npcId = segments[npcIndex + 1]
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(npcId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('npcs')
              .select('name')
              .eq('id', npcId)
              .single()

            if (!error && data) {
              newEntityNames[npcId] = data.name
              newEntityNames[`npcs/${npcId}`] = data.name
            }
          } catch (err) {
            console.error('Error fetching NPC name:', err)
          }
        }
      }

      // Check for location IDs
      const locationIndex = segments.indexOf('locations')
      if (locationIndex !== -1 && segments[locationIndex + 1] && segments[locationIndex + 1] !== 'new') {
        const locationId = segments[locationIndex + 1]
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(locationId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('locations')
              .select('name')
              .eq('id', locationId)
              .single()

            if (!error && data) {
              newEntityNames[locationId] = data.name
              newEntityNames[`locations/${locationId}`] = data.name
            }
          } catch (err) {
            console.error('Error fetching location name:', err)
          }
        }
      }

      // Check for item IDs
      const itemIndex = segments.indexOf('items')
      if (itemIndex !== -1 && segments[itemIndex + 1] && segments[itemIndex + 1] !== 'new') {
        const itemId = segments[itemIndex + 1]
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)

        if (isUUID) {
          try {
            const { data, error } = await supabase
              .from('items')
              .select('name')
              .eq('id', itemId)
              .single()

            if (!error && data) {
              newEntityNames[itemId] = data.name
              newEntityNames[`items/${itemId}`] = data.name
            }
          } catch (err) {
            console.error('Error fetching item name:', err)
          }
        }
      }

      setEntityNames(newEntityNames)
    }

    fetchEntityNames()
  }, [pathname, supabase])

  return entityNames
}
