'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Users, Plus, Search } from 'lucide-react'

interface NPC {
  id: string
  name: string
  race: string | null
  class_or_occupation: string | null
  description: string | null
  personality: string | null
  location: string | null
  relationship: string | null
  image_url: string | null
  campaign: {
    name: string
  } | null
}

export default function NPCsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [filteredNpcs, setFilteredNpcs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadNPCs()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = npcs.filter(npc =>
        npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.race?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.class_or_occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNpcs(filtered)
    } else {
      setFilteredNpcs(npcs)
    }
  }, [searchQuery, npcs])

  const loadNPCs = async () => {
    try {
      const { data, error } = await supabase
        .from('npcs')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      setNpcs(data || [])
      setFilteredNpcs(data || [])
    } catch (err) {
      console.error('Error loading NPCs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading NPCs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">NPCs</h1>
          <p className="text-muted-foreground mt-2">
            Manage your non-player characters
          </p>
        </div>
        <Link href="/app/world/npcs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New NPC
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search NPCs by name, race, class, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* NPCs Grid */}
      {filteredNpcs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No NPCs found' : 'No NPCs yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start creating NPCs to populate your world!'}
              </p>
              {!searchQuery && (
                <Link href="/app/world/npcs/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First NPC
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNpcs.map((npc) => (
            <Link key={npc.id} href={`/app/world/npcs/${npc.id}`}>
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={npc.image_url || undefined} />
                      <AvatarFallback>
                        {npc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-1">{npc.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {[npc.race, npc.class_or_occupation].filter(Boolean).join(' • ')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {npc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {npc.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {npc.location && (
                      <Badge variant="secondary" className="text-xs">
                        📍 {npc.location}
                      </Badge>
                    )}
                    {npc.relationship && (
                      <Badge variant="outline" className="text-xs">
                        {npc.relationship}
                      </Badge>
                    )}
                  </div>

                  {npc.campaign && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Campaign: {npc.campaign.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
