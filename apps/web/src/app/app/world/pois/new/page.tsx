'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import { NPCMultiSelect } from '@/components/npc-multiselect'
import { generateImage } from '@/actions/generate'

interface Location {
  id: string
  name: string
  type: string
}

interface NPCWithRole {
  npcId: string
  role: string
}

export default function NewPOIPage() {
  const router = useRouter()
  const supabase = createClient()

  // Basic Information
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [locationId, setLocationId] = useState('')
  const [campaignId, setCampaignId] = useState('')

  // Description
  const [description, setDescription] = useState('')
  const [services, setServices] = useState('')
  const [notes, setNotes] = useState('')

  // Image
  const [imageUrl, setImageUrl] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)

  // NPCs with roles
  const [npcsWithRoles, setNpcsWithRoles] = useState<NPCWithRole[]>([])
  const [selectedNpcIds, setSelectedNpcIds] = useState<string[]>([])

  // Data
  const [locations, setLocations] = useState<Location[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  // UI State
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLocations()
    loadCampaigns()
  }, [])

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, type')
      .order('name', { ascending: true })

    if (!error && data) {
      setLocations(data)
    }
  }

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name')
      .order('name', { ascending: true })

    if (!error && data) {
      setCampaigns(data)
    }
  }

  const handleGenerateImage = async (prompt: string) => {
    setGeneratingImage(true)
    try {
      const result = await generateImage(`${type || 'building'} - ${prompt}`, false)

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image')
      }

      setImageUrl(result.imageUrl)
    } catch (err) {
      console.error('Error generating image:', err)
      setError('Failed to generate image')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleNpcSelectionChange = (npcIds: string[]) => {
    setSelectedNpcIds(npcIds)

    // Preserve existing roles, add new NPCs with empty role
    const updatedNpcs = npcIds.map(npcId => {
      const existing = npcsWithRoles.find(n => n.npcId === npcId)
      return existing || { npcId, role: '' }
    })

    setNpcsWithRoles(updatedNpcs)
  }

  const handleRoleChange = (npcId: string, role: string) => {
    setNpcsWithRoles(prev =>
      prev.map(n => n.npcId === npcId ? { ...n, role } : n)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!locationId) {
      setError('Location is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create POI
      const { data: poiData, error: poiError } = await supabase
        .from('pois')
        .insert({
          user_id: user.id,
          location_id: locationId,
          campaign_id: campaignId || null,
          name: name.trim(),
          type: type || null,
          description: description.trim() || null,
          services: services.trim() || null,
          notes: notes.trim() || null,
          image_url: imageUrl || null,
        })
        .select()
        .single()

      if (poiError) throw poiError

      // Create NPC-POI links
      if (poiData && npcsWithRoles.length > 0) {
        const npcPoiLinks = npcsWithRoles.map(({ npcId, role }) => ({
          npc_id: npcId,
          poi_id: poiData.id,
          role: role || null
        }))

        const { error: linkError } = await supabase
          .from('npc_pois')
          .insert(npcPoiLinks)

        if (linkError) {
          console.error('Error linking NPCs:', linkError)
        }
      }

      router.push('/app/world/pois')
    } catch (err: any) {
      console.error('Error creating POI:', err)
      setError(err.message || 'Failed to create POI')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/app/world/pois">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Point of Interest</h1>
            <p className="text-muted-foreground">
              Create a new location point of interest
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about this point of interest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., The Prancing Pony"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tavern">Tavern</SelectItem>
                    <SelectItem value="Inn">Inn</SelectItem>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Blacksmith">Blacksmith</SelectItem>
                    <SelectItem value="Temple">Temple</SelectItem>
                    <SelectItem value="Guild Hall">Guild Hall</SelectItem>
                    <SelectItem value="Residence">Residence</SelectItem>
                    <SelectItem value="Market">Market</SelectItem>
                    <SelectItem value="Government">Government Building</SelectItem>
                    <SelectItem value="Landmark">Landmark</SelectItem>
                    <SelectItem value="Monument">Monument</SelectItem>
                    <SelectItem value="Statue">Statue</SelectItem>
                    <SelectItem value="Fountain">Fountain</SelectItem>
                    <SelectItem value="Park">Park</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={locationId} onValueChange={setLocationId} required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{location.name}</span>
                          {location.type && (
                            <span className="text-xs text-muted-foreground">({location.type})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select value={campaignId || undefined} onValueChange={(value) => setCampaignId(value || '')}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="No campaign selected" />
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
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Describe this point of interest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the appearance, atmosphere, and notable features..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">Services & Goods</Label>
              <Textarea
                id="services"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="What services or goods are available here? (e.g., Food & Lodging, Weapons & Armor, Healing Services)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes, secrets, or DM information..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* NPCs */}
        <Card>
          <CardHeader>
            <CardTitle>NPCs</CardTitle>
            <CardDescription>Link NPCs who work or frequent this location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select NPCs</Label>
              <NPCMultiSelect
                campaignId={campaignId || undefined}
                selectedNpcIds={selectedNpcIds}
                onSelectionChange={handleNpcSelectionChange}
              />
            </div>

            {npcsWithRoles.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>NPC Roles</Label>
                {npcsWithRoles.map(({ npcId, role }) => (
                  <div key={npcId} className="grid grid-cols-2 gap-3 items-center">
                    <div className="text-sm font-medium">
                      {/* NPC name will be shown via the multiselect badges */}
                      NPC #{npcId.slice(0, 8)}...
                    </div>
                    <Input
                      value={role}
                      onChange={(e) => handleRoleChange(npcId, e.target.value)}
                      placeholder="e.g., Owner, Bartender, Patron"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
            <CardDescription>Add a visual representation</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              label="POI Image"
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              onGenerateImage={handleGenerateImage}
              generatingImage={generatingImage}
              entityType="poi"
            />
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create POI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
