'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, MapPin } from 'lucide-react'

interface POI {
  id: string
  name: string
  type: string | null
  description: string | null
  location: {
    id: string
    name: string
  } | null
  npcs?: { count: number }[]
}

export default function POIsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) {
      loadPOIs()
    }
  }, [user])

  const loadPOIs = async () => {
    try {
      const { data, error } = await supabase
        .from('pois')
        .select(`
          *,
          location:locations(id, name),
          npc_pois(count)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      setPois(data || [])
    } catch (err) {
      console.error('Error loading POIs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPOIs = pois.filter((poi) =>
    poi.name.toLowerCase().includes(search.toLowerCase()) ||
    poi.type?.toLowerCase().includes(search.toLowerCase()) ||
    poi.location?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading points of interest...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Points of Interest</h1>
          <p className="text-muted-foreground mt-2">Manage shops, taverns, temples, and other notable locations</p>
        </div>
        <Link href="/app/world/pois/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New POI
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search POIs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* POIs Grid */}
      {filteredPOIs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 mt-4">No points of interest yet</h3>
              <p className="text-muted-foreground mb-6">
                {search ? 'No POIs match your search.' : 'Create POIs or generate them automatically when creating locations!'}
              </p>
              {!search && (
                <Link href="/app/world/pois/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First POI
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPOIs.map((poi) => {
            const npcCount = poi.npcs?.[0]?.count || 0

            return (
              <Link key={poi.id} href={`/app/world/pois/${poi.id}`}>
                <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{poi.name}</CardTitle>
                        {poi.type && (
                          <p className="text-sm text-muted-foreground mt-1">{poi.type}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {poi.description && (
                        <p className="text-sm line-clamp-2">{poi.description}</p>
                      )}
                      {poi.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{poi.location.name}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        👥 {npcCount} NPC{npcCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
