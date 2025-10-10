'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { AIGenerateDialog } from '@/components/ai-generate-dialog'
import { ImageUpload } from '@/components/image-upload'
import { NPCMultiSelect } from '@/components/npc-multiselect'
import { POIMultiSelect } from '@/components/poi-multiselect'
import { ArrowLeft, Sparkles, Map } from 'lucide-react'
import Link from 'next/link'
import { generateWithAI, generateLocationEntities, generateImage } from '@/actions/generate'

interface Campaign {
  id: string
  name: string
}

export default function NewLocationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Basic Info
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [region, setRegion] = useState('')
  const [climate, setClimate] = useState('')
  const [population, setPopulation] = useState('')
  const [size, setSize] = useState('')

  // Governance & Economy
  const [government, setGovernment] = useState('')
  const [economy, setEconomy] = useState('')
  const [defenses, setDefenses] = useState('')

  // Description
  const [description, setDescription] = useState('')
  const [atmosphere, setAtmosphere] = useState('')
  const [history, setHistory] = useState('')

  // Features
  const [inhabitants, setInhabitants] = useState('')
  const [pointsOfInterest, setPointsOfInterest] = useState('')
  const [notableNpcIds, setNotableNpcIds] = useState<string[]>([])
  const [selectedPoiIds, setSelectedPoiIds] = useState<string[]>([])
  const [dangers, setDangers] = useState('')

  // Story
  const [hooks, setHooks] = useState('')
  const [secrets, setSecrets] = useState('')

  // Meta
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mapUrl, setMapUrl] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingMap, setGeneratingMap] = useState(false)

  // Generated POIs and NPCs data (not yet saved to DB)
  const [generatedPoisData, setGeneratedPoisData] = useState<any[]>([])
  const [generatedNpcsData, setGeneratedNpcsData] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

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

  const handleAIGenerate = async (prompt: string, fullDetails: boolean = false) => {
    try {
      const result = await generateWithAI('location', prompt, fullDetails)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate')
      }

      const data = result.data

      setName(String(data.name || ''))
      setType(String(data.type || ''))
      setRegion(String(data.region || ''))
      setClimate(String(data.climate || ''))
      setPopulation(String(data.population || ''))
      setSize(String(data.size || ''))
      setGovernment(String(data.government || ''))
      setEconomy(String(data.economy || ''))
      setDefenses(String(data.defenses || ''))
      setDescription(String(data.description || ''))
      setAtmosphere(String(data.atmosphere || ''))
      setHistory(String(data.history || ''))
      setInhabitants(String(data.inhabitants || ''))
      setPointsOfInterest(String(data.points_of_interest || ''))
      setDangers(String(data.dangers || ''))
      setHooks(String(data.hooks || ''))
      setSecrets(String(data.secrets || ''))
      setNotes(String(data.notes || ''))

      // Generate POIs and NPCs data (don't save to DB yet - only when user clicks Create)
      if (data.points_of_interest || data.inhabitants) {
        try {
          const entitiesResult = await generateLocationEntities({
            name: data.name,
            type: data.type,
            inhabitants: data.inhabitants || data.population,
            population: data.population,
            pointsOfInterest: data.points_of_interest
          })

          if (entitiesResult.success && entitiesResult.data) {
            const { pois } = entitiesResult.data
            // Store the generated data in state - will be saved when user clicks Create Location
            setGeneratedPoisData(pois || [])

            // Extract NPCs from POIs
            const allNpcs = (pois || []).flatMap((poi: any) =>
              (poi.npcs || []).map((npc: any) => ({ ...npc, poiName: poi.name, poiType: poi.type }))
            )
            setGeneratedNpcsData(allNpcs)
          }
        } catch (genError) {
          console.error('Error generating POIs and NPCs:', genError)
          // Don't fail the whole generation if this fails
        }
      }
    } catch (err) {
      console.error('Error generating location:', err)
      alert('Failed to generate location with AI. Please try again.')
    }
  }

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true)

      const promptParts = []
      if (name) promptParts.push(name)
      if (type) promptParts.push(`a ${type}`)
      if (description) promptParts.push(description)
      if (atmosphere) promptParts.push(atmosphere)

      const imagePrompt = promptParts.join(', ')

      if (!imagePrompt.trim()) {
        alert('Please fill in some details about the location first')
        return
      }

      const result = await generateImage(imagePrompt, false)

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image')
      }

      setImageUrl(result.imageUrl)
    } catch (err) {
      console.error('Error generating image:', err)
      alert('Failed to generate image. Please try again.')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleGenerateMap = async () => {
    try {
      setGeneratingMap(true)

      const promptParts = []
      if (name) promptParts.push(`of ${name}`)
      if (type) promptParts.push(type)
      if (size) promptParts.push(size)

      // Add POIs to the prompt for legend inclusion
      if (pointsOfInterest) {
        const poiList = pointsOfInterest.split('\n').filter(p => p.trim()).slice(0, 8).join(', ')
        if (poiList) {
          promptParts.push(`showing these locations in the legend: ${poiList}`)
        }
      }

      const mapPrompt = promptParts.join(', ')

      const result = await generateImage(mapPrompt, true)

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate map')
      }

      setMapUrl(result.imageUrl)
    } catch (err) {
      console.error('Error generating map:', err)
      alert('Failed to generate map. Please try again.')
    } finally {
      setGeneratingMap(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      // First, create the location
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          type: type?.trim() || null,
          region: region?.trim() || null,
          climate: climate?.trim() || null,
          population: population?.trim() || null,
          size: size?.trim() || null,
          government: government?.trim() || null,
          economy: economy?.trim() || null,
          defenses: defenses?.trim() || null,
          description: description?.trim() || null,
          atmosphere: atmosphere?.trim() || null,
          history: history?.trim() || null,
          inhabitants: inhabitants?.trim() || null,
          points_of_interest: pointsOfInterest?.trim() || null,
          notable_npcs: null, // Will use relationship table instead
          dangers: dangers?.trim() || null,
          hooks: hooks?.trim() || null,
          secrets: secrets?.trim() || null,
          notes: notes?.trim() || null,
          image_url: imageUrl?.trim() || null,
          map_url: mapUrl?.trim() || null,
          campaign_id: campaignId || null
        })
        .select()
        .single()

      if (locationError) throw locationError

      // Create POIs and NPCs from generated data (from AI generation)
      if (locationData && generatedPoisData.length > 0) {
        try {
          // Create POIs and NPCs from the data generated during AI generation
          for (const poi of generatedPoisData) {
            const { data: poiData, error: poiError } = await supabase
              .from('pois')
              .insert({
                user_id: user?.id,
                location_id: locationData.id,
                campaign_id: campaignId || null,
                name: poi.name,
                type: poi.type,
                description: poi.description,
                services: poi.services
              })
              .select()
              .single()

            if (!poiError && poiData) {
              // Create NPCs for this POI
              for (const npc of poi.npcs || []) {
                const { data: npcData, error: npcError } = await supabase
                  .from('npcs')
                  .insert({
                    user_id: user?.id,
                    campaign_id: campaignId || null,
                    poi_id: poiData.id,
                    name: npc.name,
                    npc_type: npc.role === 'Owner' || npc.role === 'Shopkeeper' ? 'Shopkeeper' :
                             npc.role === 'Bartender' ? 'Bartender' :
                             npc.role === 'Guard' ? 'Guard' :
                             npc.role === 'Patron' ? 'Patron' : 'Other',
                    race: npc.race,
                    class_or_occupation: npc.class_or_occupation,
                    description: npc.description,
                    personality: npc.personality,
                    appearance: npc.appearance,
                    location: `${poi.name} in ${name.trim()}`
                  })
                  .select()
                  .single()

                // Link NPC to POI
                if (!npcError && npcData) {
                  await supabase
                    .from('npc_pois')
                    .insert({
                      npc_id: npcData.id,
                      poi_id: poiData.id,
                      role: npc.role
                    })
                }
              }
            }
          }
        } catch (genError) {
          console.error('Error creating POIs and NPCs:', genError)
          // Don't fail the whole operation if this fails
        }
      }

      // Link manually selected NPCs to this location
      if (notableNpcIds.length > 0 && locationData) {
        try {
          // Update each NPC to set their location_id and location fields
          for (const npcId of notableNpcIds) {
            await supabase
              .from('npcs')
              .update({
                location_id: locationData.id,
                location: name.trim()
              })
              .eq('id', npcId)
          }
        } catch (linkError) {
          console.error('Error linking NPCs to location:', linkError)
          // Don't fail the whole operation
        }
      }

      // Link manually selected POIs to this location
      if (selectedPoiIds.length > 0 && locationData) {
        try {
          // Update each POI to set their location_id field
          for (const poiId of selectedPoiIds) {
            await supabase
              .from('pois')
              .update({
                location_id: locationData.id
              })
              .eq('id', poiId)
          }
        } catch (linkError) {
          console.error('Error linking POIs to location:', linkError)
          // Don't fail the whole operation
        }
      }

      router.push('/app/world/locations')
    } catch (err) {
      console.error('Error creating location:', err)
      alert('Failed to create location. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2">
        <Link href="/app/world/locations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Locations
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">New Location</h1>
          <p className="text-muted-foreground mt-2">Create a location for your campaign world</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAIDialog(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Waterdeep, The Prancing Pony"
                  required
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

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g., Sword Coast, Feywild"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="climate">Climate</Label>
                <Input
                  id="climate"
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  placeholder="e.g., Temperate, Arctic, Tropical"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={size || undefined} onValueChange={setSize}>
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thorp">Thorp (20-80 people)</SelectItem>
                    <SelectItem value="Hamlet">Hamlet (81-400 people)</SelectItem>
                    <SelectItem value="Village">Village (401-900 people)</SelectItem>
                    <SelectItem value="Small Town">Small Town (901-2,000 people)</SelectItem>
                    <SelectItem value="Large Town">Large Town (2,001-5,000 people)</SelectItem>
                    <SelectItem value="Small City">Small City (5,001-12,000 people)</SelectItem>
                    <SelectItem value="Large City">Large City (12,001-25,000 people)</SelectItem>
                    <SelectItem value="Metropolis">Metropolis (25,000+ people)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="population">Population</Label>
                <Input
                  id="population"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  placeholder="e.g., ~10,000 (mostly humans and dwarves)"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Governance & Economy */}
        <Card>
          <CardHeader>
            <CardTitle>Governance & Economy</CardTitle>
            <CardDescription>How the location is ruled and sustained</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="government">Government</Label>
                <Textarea
                  id="government"
                  value={government}
                  onChange={(e) => setGovernment(e.target.value)}
                  placeholder="e.g., Council of Elders, Monarchy, Anarchy..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="economy">Economy</Label>
                <Textarea
                  id="economy"
                  value={economy}
                  onChange={(e) => setEconomy(e.target.value)}
                  placeholder="Main industries, trade goods, wealth level..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defenses">Defenses</Label>
              <Textarea
                id="defenses"
                value={defenses}
                onChange={(e) => setDefenses(e.target.value)}
                placeholder="Walls, guards, magical wards, military strength..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>What the location looks and feels like</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">General Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overall description of the location..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="atmosphere">Atmosphere & Mood</Label>
              <Textarea
                id="atmosphere"
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                placeholder="How does it feel to be here? Sights, sounds, smells..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="history">History</Label>
              <Textarea
                id="history"
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="Important historical events, founding, major changes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features & Inhabitants */}
        <Card>
          <CardHeader>
            <CardTitle>Features & Inhabitants</CardTitle>
            <CardDescription>What and who can be found here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inhabitants">Inhabitants</Label>
              <Textarea
                id="inhabitants"
                value={inhabitants}
                onChange={(e) => setInhabitants(e.target.value)}
                placeholder="Who lives here? Demographics, factions, creatures..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsOfInterest">Points of Interest</Label>
              <Textarea
                id="pointsOfInterest"
                value={pointsOfInterest}
                onChange={(e) => setPointsOfInterest(e.target.value)}
                placeholder="Notable buildings, landmarks, shops, districts..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Notable NPCs</Label>
              <NPCMultiSelect
                campaignId={campaignId}
                selectedNpcIds={notableNpcIds}
                onSelectionChange={setNotableNpcIds}
              />
              <p className="text-xs text-muted-foreground">
                Select existing NPCs found at this location, or auto-generate them below
              </p>
            </div>

            <div className="space-y-2">
              <Label>Points of Interest (Linked)</Label>
              <POIMultiSelect
                campaignId={campaignId}
                selectedPoiIds={selectedPoiIds}
                onSelectionChange={setSelectedPoiIds}
              />
              <p className="text-xs text-muted-foreground">
                Link existing POIs to this location, or auto-generate them below
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dangers">Dangers & Threats</Label>
              <Textarea
                id="dangers"
                value={dangers}
                onChange={(e) => setDangers(e.target.value)}
                placeholder="Hazards, monsters, environmental dangers..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Story Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Story Elements</CardTitle>
            <CardDescription>Plot hooks and hidden information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="hooks">Adventure Hooks</Label>
              <Textarea
                id="hooks"
                value={hooks}
                onChange={(e) => setHooks(e.target.value)}
                placeholder="Quest ideas, rumors, opportunities for adventure..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secrets">Secrets</Label>
              <Textarea
                id="secrets"
                value={secrets}
                onChange={(e) => setSecrets(e.target.value)}
                placeholder="Hidden information, mysteries, plot twists..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Images & Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              label="Location Image"
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              onGenerateImage={handleGenerateImage}
              generatingImage={generatingImage}
              entityType="location"
            />

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="mapUrl">Map</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMap}
                  disabled={generatingMap || !name}
                >
                  {generatingMap ? (
                    'Generating Map...'
                  ) : (
                    <>
                      <Map className="mr-2 h-4 w-4" />
                      Generate Map with AI
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="mapUrl"
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://... or generate a map"
              />
              {mapUrl && (
                <div className="mt-2">
                  <img
                    src={mapUrl}
                    alt="Location map"
                    className="rounded-lg border max-w-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">DM Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for the DM..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4">
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create Location'}
            </Button>
            <Link href="/app/world/locations">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>

      <AIGenerateDialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        type="location"
        onGenerate={handleAIGenerate}
      />
    </div>
  )
}
