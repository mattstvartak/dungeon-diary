'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Loader2, Trash2, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import { NPCMultiSelect } from '@/components/npc-multiselect'
import { Badge } from '@/components/ui/badge'
import { generateImage } from '@/actions/generate'

interface Location {
  id: string
  name: string
  type: string
}

interface NPC {
  id: string
  name: string
  race: string | null
  class_or_occupation: string | null
}

interface NPCWithRole {
  npc: NPC
  role: string | null
  linkId: string
}

export default function POIDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const poiId = params.id as string

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

  // NPCs
  const [npcsWithRoles, setNpcsWithRoles] = useState<NPCWithRole[]>([])
  const [selectedNpcIds, setSelectedNpcIds] = useState<string[]>([])

  // Data
  const [locations, setLocations] = useState<Location[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPOI()
    loadLocations()
    loadCampaigns()
  }, [poiId])

  const loadPOI = async () => {
    try {
      const { data, error } = await supabase
        .from('pois')
        .select(`
          *,
          npc_pois(
            id,
            role,
            npc:npcs(
              id,
              name,
              race,
              class_or_occupation
            )
          )
        `)
        .eq('id', poiId)
        .single()

      if (error) throw error

      if (data) {
        setName(data.name || '')
        setType(data.type || '')
        setLocationId(data.location_id || '')
        setCampaignId(data.campaign_id || '')
        setDescription(data.description || '')
        setServices(data.services || '')
        setNotes(data.notes || '')
        setImageUrl(data.image_url || '')

        // Load NPCs with roles
        const npcData: NPCWithRole[] = (data.npc_pois || [])
          .filter((np: any) => np.npc)
          .map((np: any) => ({
            npc: np.npc,
            role: np.role,
            linkId: np.id
          }))

        setNpcsWithRoles(npcData)
        setSelectedNpcIds(npcData.map(n => n.npc.id))
      }
    } catch (err: any) {
      console.error('Error loading POI:', err)
      setError(err.message || 'Failed to load POI')
    } finally {
      setLoading(false)
    }
  }

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

  const handleNpcSelectionChange = async (npcIds: string[]) => {
    setSelectedNpcIds(npcIds)

    // Find which NPCs were added and which were removed
    const currentIds = npcsWithRoles.map(n => n.npc.id)
    const addedIds = npcIds.filter(id => !currentIds.includes(id))
    const removedIds = currentIds.filter(id => !npcIds.includes(id))

    // Load full NPC data for new NPCs
    if (addedIds.length > 0) {
      const { data: newNpcs } = await supabase
        .from('npcs')
        .select('id, name, race, class_or_occupation')
        .in('id', addedIds)

      if (newNpcs) {
        const newNpcsWithRoles: NPCWithRole[] = newNpcs.map(npc => ({
          npc,
          role: null,
          linkId: '' // Will be created on save
        }))

        setNpcsWithRoles(prev => [
          ...prev.filter(n => !removedIds.includes(n.npc.id)),
          ...newNpcsWithRoles
        ])
      }
    } else {
      // Just remove the NPCs
      setNpcsWithRoles(prev => prev.filter(n => !removedIds.includes(n.npc.id)))
    }
  }

  const handleRoleChange = (npcId: string, role: string) => {
    setNpcsWithRoles(prev =>
      prev.map(n => n.npc.id === npcId ? { ...n, role } : n)
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
      // Update POI
      const { error: updateError } = await supabase
        .from('pois')
        .update({
          name: name.trim(),
          type: type || null,
          // location_id is not updatable - POIs cannot change locations
          campaign_id: campaignId || null,
          description: description.trim() || null,
          services: services.trim() || null,
          notes: notes.trim() || null,
          image_url: imageUrl || null,
        })
        .eq('id', poiId)

      if (updateError) throw updateError

      // Update NPC links
      // Delete all existing links
      await supabase
        .from('npc_pois')
        .delete()
        .eq('poi_id', poiId)

      // Create new links
      if (npcsWithRoles.length > 0) {
        const npcPoiLinks = npcsWithRoles.map(({ npc, role }) => ({
          npc_id: npc.id,
          poi_id: poiId,
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
      console.error('Error updating POI:', err)
      setError(err.message || 'Failed to update POI')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('pois')
        .delete()
        .eq('id', poiId)

      if (error) throw error

      router.push('/app/world/pois')
    } catch (err: any) {
      console.error('Error deleting POI:', err)
      setError(err.message || 'Failed to delete POI')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
            <h1 className="text-3xl font-bold">{name || 'Point of Interest'}</h1>
            <p className="text-muted-foreground">
              Edit this point of interest
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Point of Interest?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this POI and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                <Label htmlFor="location">Location</Label>
                <Select value={locationId} disabled>
                  <SelectTrigger id="location">
                    <SelectValue />
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
                <p className="text-xs text-muted-foreground">
                  POIs cannot be moved to a different location
                </p>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  NPCs
                </CardTitle>
                <CardDescription>NPCs who work or frequent this location</CardDescription>
              </div>
              <Badge variant="secondary">{npcsWithRoles.length} linked</Badge>
            </div>
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
                <Label>NPC Roles at this Location</Label>
                <div className="space-y-3">
                  {npcsWithRoles.map(({ npc, role }) => (
                    <div key={npc.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[npc.race, npc.class_or_occupation].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <Input
                        value={role || ''}
                        onChange={(e) => handleRoleChange(npc.id, e.target.value)}
                        placeholder="e.g., Owner, Bartender, Patron"
                      />
                    </div>
                  ))}
                </div>
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
