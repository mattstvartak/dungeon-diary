'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Trash2, Edit, Save } from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  type: string | null
  description: string | null
  inhabitants: string | null
  points_of_interest: string | null
  notes: string | null
  image_url: string | null
  campaign_id: string | null
  created_at: string
  updated_at: string
}

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const locationId = params.id as string

  const [location, setLocation] = useState<Location | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [inhabitants, setInhabitants] = useState('')
  const [pointsOfInterest, setPointsOfInterest] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')

  useEffect(() => {
    if (user && locationId) {
      loadLocation()
      loadCampaigns()
    }
  }, [user, locationId])

  const loadLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single()

      if (error) throw error

      setLocation(data)
      setName(data.name)
      setType(data.type || '')
      setDescription(data.description || '')
      setInhabitants(data.inhabitants || '')
      setPointsOfInterest(data.points_of_interest || '')
      setNotes(data.notes || '')
      setImageUrl(data.image_url || '')
      setCampaignId(data.campaign_id || '')
    } catch (err) {
      console.error('Error loading location:', err)
      alert('Failed to load location')
      router.push('/app/world/locations')
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('Error loading campaigns:', err)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: name.trim(),
          type: type.trim() || null,
          description: description.trim() || null,
          inhabitants: inhabitants.trim() || null,
          points_of_interest: pointsOfInterest.trim() || null,
          notes: notes.trim() || null,
          image_url: imageUrl.trim() || null,
          campaign_id: campaignId || null
        })
        .eq('id', locationId)

      if (error) throw error

      await loadLocation()
      setEditing(false)
    } catch (err) {
      console.error('Error updating location:', err)
      alert('Failed to update location. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) throw error

      router.push('/app/world/locations')
    } catch (err) {
      console.error('Error deleting location:', err)
      alert('Failed to delete location. Please try again.')
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if (location) {
      setName(location.name)
      setType(location.type || '')
      setDescription(location.description || '')
      setInhabitants(location.inhabitants || '')
      setPointsOfInterest(location.points_of_interest || '')
      setNotes(location.notes || '')
      setImageUrl(location.image_url || '')
      setCampaignId(location.campaign_id || '')
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading location...</div>
      </div>
    )
  }

  if (!location) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/world/locations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Locations
          </Button>
        </Link>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      {(location.image_url || editing) && (
        <Card className="overflow-hidden">
          {editing ? (
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </CardContent>
          ) : location.image_url ? (
            <div className="h-64 w-full overflow-hidden bg-muted">
              <img
                src={location.image_url}
                alt={location.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
        </Card>
      )}

      <Card>
        <CardHeader>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select location type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="Town">Town</SelectItem>
                    <SelectItem value="Village">Village</SelectItem>
                    <SelectItem value="Settlement">Settlement</SelectItem>
                    <SelectItem value="Tavern">Tavern</SelectItem>
                    <SelectItem value="Inn">Inn</SelectItem>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Temple">Temple</SelectItem>
                    <SelectItem value="Dungeon">Dungeon</SelectItem>
                    <SelectItem value="Castle">Castle</SelectItem>
                    <SelectItem value="Fortress">Fortress</SelectItem>
                    <SelectItem value="Tower">Tower</SelectItem>
                    <SelectItem value="Ruins">Ruins</SelectItem>
                    <SelectItem value="Forest">Forest</SelectItem>
                    <SelectItem value="Mountain">Mountain</SelectItem>
                    <SelectItem value="Cave">Cave</SelectItem>
                    <SelectItem value="Plains">Plains</SelectItem>
                    <SelectItem value="Desert">Desert</SelectItem>
                    <SelectItem value="Swamp">Swamp</SelectItem>
                    <SelectItem value="Island">Island</SelectItem>
                    <SelectItem value="Region">Region</SelectItem>
                    <SelectItem value="POI">Point of Interest</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div>
              <CardTitle className="text-2xl">{location.name}</CardTitle>
              {location.type && (
                <Badge variant="secondary" className="mt-2">
                  {location.type}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign */}
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Select value={campaignId || undefined} onValueChange={setCampaignId}>
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            campaignId && (
              <div>
                <span className="text-sm font-semibold">Campaign: </span>
                <span className="text-sm text-muted-foreground">
                  {campaigns.find(c => c.id === campaignId)?.name || 'Unknown'}
                </span>
              </div>
            )
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {editing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {location.description || 'No description'}
              </p>
            )}
          </div>

          {/* Inhabitants */}
          <div className="space-y-2">
            <Label>Inhabitants</Label>
            {editing ? (
              <Textarea
                value={inhabitants}
                onChange={(e) => setInhabitants(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {location.inhabitants || 'No inhabitants noted'}
              </p>
            )}
          </div>

          {/* Points of Interest */}
          <div className="space-y-2">
            <Label>Points of Interest</Label>
            {editing ? (
              <Textarea
                value={pointsOfInterest}
                onChange={(e) => setPointsOfInterest(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {location.points_of_interest || 'No points of interest noted'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            {editing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {location.notes || 'No additional notes'}
              </p>
            )}
          </div>

          {/* Metadata */}
          {!editing && (
            <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
              <div>Created: {formatDateTime(location.created_at)}</div>
              <div>Last updated: {formatDateTime(location.updated_at)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
