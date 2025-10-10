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
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { generateWithAI, generateImage } from '@/actions/generate'

interface Campaign {
  id: string
  name: string
}

export default function NewNPCPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [pois, setPois] = useState<any[]>([])

  // Basic Info
  const [name, setName] = useState('')
  const [npcType, setNpcType] = useState('')
  const [race, setRace] = useState('')
  const [classOrOccupation, setClassOrOccupation] = useState('')
  const [level, setLevel] = useState('')
  const [alignment, setAlignment] = useState('')
  const [faction, setFaction] = useState('')
  const [status, setStatus] = useState('alive')
  const [locationId, setLocationId] = useState('')
  const [poiId, setPoiId] = useState('')

  // Combat Stats
  const [armorClass, setArmorClass] = useState('')
  const [hitPoints, setHitPoints] = useState('')
  const [speed, setSpeed] = useState('')
  const [challengeRating, setChallengeRating] = useState('')

  // Ability Scores
  const [str, setStr] = useState('')
  const [dex, setDex] = useState('')
  const [con, setCon] = useState('')
  const [int, setInt] = useState('')
  const [wis, setWis] = useState('')
  const [cha, setCha] = useState('')

  // Skills & Abilities
  const [skills, setSkills] = useState('')
  const [languages, setLanguages] = useState('')
  const [abilities, setAbilities] = useState('')

  // Description
  const [appearance, setAppearance] = useState('')
  const [personality, setPersonality] = useState('')
  const [voiceMannerisms, setVoiceMannerisms] = useState('')
  const [description, setDescription] = useState('')

  // Story & Relationships
  const [backstory, setBackstory] = useState('')
  const [goals, setGoals] = useState('')
  const [secrets, setSecrets] = useState('')
  const [location, setLocation] = useState('')
  const [relationship, setRelationship] = useState('')

  // Meta
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)

  useEffect(() => {
    if (user) {
      loadCampaigns()
      loadLocations()
      loadPOIs()
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

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, type')
        .order('name', { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      console.error('Error loading locations:', err)
    }
  }

  const loadPOIs = async () => {
    try {
      const { data, error } = await supabase
        .from('pois')
        .select('id, name, type')
        .order('name', { ascending: true })

      if (error) throw error
      setPois(data || [])
    } catch (err) {
      console.error('Error loading POIs:', err)
    }
  }


  const handleAIGenerate = async (prompt: string) => {
    try {
      const result = await generateWithAI('npc', prompt, false)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate')
      }

      const data = result.data

      setName(String(data.name || ''))
      setRace(String(data.race || ''))
      setClassOrOccupation(String(data.class_or_occupation || ''))
      setAlignment(String(data.alignment || ''))
      setDescription(String(data.description || ''))
      setPersonality(String(data.personality || ''))
      setAppearance(String(data.appearance || ''))
      setBackstory(String(data.backstory || ''))
      setGoals(String(data.goals || ''))
      setLocation(String(data.location || ''))
      setRelationship(String(data.relationship || ''))
      setNotes(String(data.notes || ''))
    } catch (err) {
      console.error('Error generating NPC:', err)
      alert('Failed to generate NPC with AI. Please try again.')
    }
  }

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true)

      const promptParts = []
      if (name) promptParts.push(name)
      if (race) promptParts.push(race)
      if (classOrOccupation) promptParts.push(classOrOccupation)
      if (appearance) promptParts.push(appearance)
      if (description) promptParts.push(description)

      const imagePrompt = promptParts.join(', ')

      if (!imagePrompt.trim()) {
        alert('Please fill in some details about the NPC first (name, race, appearance, etc.)')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const abilityScores = {
        str: str ? parseInt(str) : null,
        dex: dex ? parseInt(dex) : null,
        con: con ? parseInt(con) : null,
        int: int ? parseInt(int) : null,
        wis: wis ? parseInt(wis) : null,
        cha: cha ? parseInt(cha) : null
      }

      const { data: npcData, error } = await supabase
        .from('npcs')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          npc_type: npcType?.trim() || null,
          race: race?.trim() || null,
          class_or_occupation: classOrOccupation?.trim() || null,
          level: level ? parseInt(level) : null,
          alignment: alignment?.trim() || null,
          faction: faction?.trim() || null,
          status: status || 'alive',
          location_id: locationId || null,
          armor_class: armorClass ? parseInt(armorClass) : null,
          hit_points: hitPoints?.trim() || null,
          speed: speed?.trim() || null,
          challenge_rating: challengeRating?.trim() || null,
          ability_scores: abilityScores,
          skills: skills?.trim() || null,
          languages: languages?.trim() || null,
          abilities: abilities?.trim() || null,
          appearance: appearance?.trim() || null,
          personality: personality?.trim() || null,
          voice_mannerisms: voiceMannerisms?.trim() || null,
          description: description?.trim() || null,
          backstory: backstory?.trim() || null,
          goals: goals?.trim() || null,
          secrets: secrets?.trim() || null,
          location: location?.trim() || null,
          relationship: relationship?.trim() || null,
          notes: notes?.trim() || null,
          image_url: imageUrl?.trim() || null,
          campaign_id: campaignId || null
        })
        .select()
        .single()

      if (error) throw error

      // If POI is selected, create the NPC-POI link
      if (poiId && npcData) {
        await supabase
          .from('npc_pois')
          .insert({
            npc_id: npcData.id,
            poi_id: poiId,
            role: classOrOccupation || npcType || null
          })
      }

      router.push('/app/world/npcs')
    } catch (err) {
      console.error('Error creating NPC:', err)
      alert('Failed to create NPC. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2">
        <Link href="/app/world/npcs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to NPCs
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">New NPC</h1>
          <p className="text-muted-foreground mt-2">Create a non-player character for your campaign</p>
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
        {/* NPC Type Selection - Required First */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>NPC Type *</CardTitle>
            <CardDescription>Select the type of NPC first - this will determine compatible locations and POIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Select value={npcType} onValueChange={setNpcType} required>
                <SelectTrigger id="npcType">
                  <SelectValue placeholder="Select NPC type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ally">Ally</SelectItem>
                  <SelectItem value="Enemy">Enemy</SelectItem>
                  <SelectItem value="Boss">Boss (BBEG)</SelectItem>
                  <SelectItem value="Shopkeeper">Shopkeeper</SelectItem>
                  <SelectItem value="Innkeeper">Innkeeper</SelectItem>
                  <SelectItem value="Bartender">Bartender</SelectItem>
                  <SelectItem value="Quest Giver">Quest Giver</SelectItem>
                  <SelectItem value="Guard">Guard</SelectItem>
                  <SelectItem value="Merchant">Merchant</SelectItem>
                  <SelectItem value="Noble">Noble</SelectItem>
                  <SelectItem value="Commoner">Commoner</SelectItem>
                  <SelectItem value="Patron">Patron</SelectItem>
                  <SelectItem value="Contact">Contact</SelectItem>
                  <SelectItem value="Informant">Informant</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {!npcType && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  ⚠️ Please select an NPC type to continue
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the NPC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Elara Moonwhisper"
                  required
                  disabled={!npcType}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="race">Race</Label>
                <Input
                  id="race"
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  placeholder="e.g., High Elf, Human, Tiefling"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classOrOccupation">Class/Occupation</Label>
                <Input
                  id="classOrOccupation"
                  value={classOrOccupation}
                  onChange={(e) => setClassOrOccupation(e.target.value)}
                  placeholder="e.g., Wizard, Merchant, Guard Captain"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  max="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Select value={alignment || undefined} onValueChange={setAlignment}>
                  <SelectTrigger id="alignment">
                    <SelectValue placeholder="Select alignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lawful Good">Lawful Good</SelectItem>
                    <SelectItem value="Neutral Good">Neutral Good</SelectItem>
                    <SelectItem value="Chaotic Good">Chaotic Good</SelectItem>
                    <SelectItem value="Lawful Neutral">Lawful Neutral</SelectItem>
                    <SelectItem value="True Neutral">True Neutral</SelectItem>
                    <SelectItem value="Chaotic Neutral">Chaotic Neutral</SelectItem>
                    <SelectItem value="Lawful Evil">Lawful Evil</SelectItem>
                    <SelectItem value="Neutral Evil">Neutral Evil</SelectItem>
                    <SelectItem value="Chaotic Evil">Chaotic Evil</SelectItem>
                    <SelectItem value="Unaligned">Unaligned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status || undefined} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alive">Alive</SelectItem>
                    <SelectItem value="dead">Dead</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faction">Faction/Organization</Label>
                <Input
                  id="faction"
                  value={faction}
                  onChange={(e) => setFaction(e.target.value)}
                  placeholder="e.g., Harpers, Zhentarim, City Guard"
                />
              </div>

              <div className="space-y-2">
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

        {/* Combat Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Combat Statistics</CardTitle>
            <CardDescription>Combat-related stats and abilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="armorClass">Armor Class</Label>
                <Input
                  id="armorClass"
                  type="number"
                  value={armorClass}
                  onChange={(e) => setArmorClass(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hitPoints">Hit Points</Label>
                <Input
                  id="hitPoints"
                  value={hitPoints}
                  onChange={(e) => setHitPoints(e.target.value)}
                  placeholder="e.g., 45 (6d8+18)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed">Speed</Label>
                <Input
                  id="speed"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  placeholder="e.g., 30 ft."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challengeRating">CR</Label>
                <Input
                  id="challengeRating"
                  value={challengeRating}
                  onChange={(e) => setChallengeRating(e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-4">Ability Scores</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="str" className="text-xs">STR</Label>
                  <Input
                    id="str"
                    type="number"
                    value={str}
                    onChange={(e) => setStr(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dex" className="text-xs">DEX</Label>
                  <Input
                    id="dex"
                    type="number"
                    value={dex}
                    onChange={(e) => setDex(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="con" className="text-xs">CON</Label>
                  <Input
                    id="con"
                    type="number"
                    value={con}
                    onChange={(e) => setCon(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="int" className="text-xs">INT</Label>
                  <Input
                    id="int"
                    type="number"
                    value={int}
                    onChange={(e) => setInt(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wis" className="text-xs">WIS</Label>
                  <Input
                    id="wis"
                    type="number"
                    value={wis}
                    onChange={(e) => setWis(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cha" className="text-xs">CHA</Label>
                  <Input
                    id="cha"
                    type="number"
                    value={cha}
                    onChange={(e) => setCha(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="30"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., Perception +5, Stealth +7, Arcana +8"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages">Languages</Label>
                <Textarea
                  id="languages"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g., Common, Elvish, Draconic"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="abilities">Special Abilities</Label>
              <Textarea
                id="abilities"
                value={abilities}
                onChange={(e) => setAbilities(e.target.value)}
                placeholder="List special abilities, spells, or powers..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Description & Personality */}
        <Card>
          <CardHeader>
            <CardTitle>Description & Personality</CardTitle>
            <CardDescription>How the NPC looks, acts, and speaks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appearance">Appearance</Label>
              <Textarea
                id="appearance"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Physical description, clothing, distinguishing features..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">Personality Traits</Label>
              <Textarea
                id="personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Demeanor, quirks, ideals, bonds, flaws..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceMannerisms">Voice & Mannerisms</Label>
              <Textarea
                id="voiceMannerisms"
                value={voiceMannerisms}
                onChange={(e) => setVoiceMannerisms(e.target.value)}
                placeholder="How they speak, accent, catchphrases, gestures..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">General Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overall summary of the NPC..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Story & Relationships */}
        <Card>
          <CardHeader>
            <CardTitle>Story & Relationships</CardTitle>
            <CardDescription>Background, motivations, and connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea
                id="backstory"
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                placeholder="History, origin, past events..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="goals">Goals & Motivations</Label>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What do they want? What drives them?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secrets">Secrets</Label>
                <Textarea
                  id="secrets"
                  value={secrets}
                  onChange={(e) => setSecrets(e.target.value)}
                  placeholder="Hidden information, plot hooks..."
                  rows={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="locationId">Linked Location</Label>
                <Select
                  value={locationId}
                  onValueChange={(value) => {
                    setLocationId(value)
                    if (value) setPoiId('') // Clear POI when location is selected
                  }}
                  disabled={!npcType || poiId !== ''}
                >
                  <SelectTrigger id="locationId">
                    <SelectValue placeholder={
                      !npcType ? "Select NPC type first" :
                      poiId ? "Cannot select - POI already linked" :
                      "Select location..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                        {loc.type && <span className="text-xs opacity-70"> ({loc.type})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link to a location (cannot be linked to both location and POI)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poiId">Linked POI</Label>
                <Select
                  value={poiId}
                  onValueChange={(value) => {
                    setPoiId(value)
                    if (value) setLocationId('') // Clear location when POI is selected
                  }}
                  disabled={!npcType || locationId !== ''}
                >
                  <SelectTrigger id="poiId">
                    <SelectValue placeholder={
                      !npcType ? "Select NPC type first" :
                      locationId ? "Cannot select - Location already linked" :
                      "Select POI..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {pois.map((poi) => (
                      <SelectItem key={poi.id} value={poi.id}>
                        {poi.name}
                        {poi.type && <span className="text-xs opacity-70"> ({poi.type})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link to a specific POI (cannot be linked to both location and POI)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location Notes</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Additional location details..."
                disabled={!npcType}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Party</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g., Quest Giver, Ally, Enemy, Neutral"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Image & Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              label="Portrait"
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              onGenerateImage={handleGenerateImage}
              generatingImage={generatingImage}
              entityType="npc"
            />

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
        <div className="flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4">
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create NPC'}
          </Button>
          <Link href="/app/world/npcs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <AIGenerateDialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        type="npc"
        onGenerate={handleAIGenerate}
      />
    </div>
  )
}
