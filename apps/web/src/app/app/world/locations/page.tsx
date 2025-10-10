'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, Search } from 'lucide-react'

interface Location {
  id: string
  name: string
  type: string | null
  description: string | null
  inhabitants: string | null
  points_of_interest: string | null
  image_url: string | null
  campaign: {
    name: string
  } | null
}

export default function LocationsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadLocations()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLocations(filtered)
    } else {
      setFilteredLocations(locations)
    }
  }, [searchQuery, locations])

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      setLocations(data || [])
      setFilteredLocations(data || [])
    } catch (err) {
      console.error('Error loading locations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading locations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-2">
            Map out your world's places
          </p>
        </div>
        <Link href="/app/world/locations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Location
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
              placeholder="Search locations by name, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No locations found' : 'No locations yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start creating locations to build your world!'}
              </p>
              {!searchQuery && (
                <Link href="/app/world/locations/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Location
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Link key={location.id} href={`/app/world/locations/${location.id}`}>
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                {location.image_url && (
                  <div className="h-32 w-full overflow-hidden bg-muted">
                    <img
                      src={location.image_url}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{location.name}</span>
                  </CardTitle>
                  {location.type && (
                    <CardDescription className="text-xs">
                      {location.type}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {location.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {location.description}
                    </p>
                  )}

                  {location.inhabitants && (
                    <div className="text-xs">
                      <span className="font-semibold">Inhabitants: </span>
                      <span className="text-muted-foreground">{location.inhabitants}</span>
                    </div>
                  )}

                  {location.campaign && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Campaign: {location.campaign.name}
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
