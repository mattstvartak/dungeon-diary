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

export default function NewItemPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Basic Info
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [rarity, setRarity] = useState('')
  const [value, setValue] = useState('')
  const [weight, setWeight] = useState('')

  // Magical Properties
  const [attunement, setAttunement] = useState(false)
  const [requiresAttunementBy, setRequiresAttunementBy] = useState('')
  const [charges, setCharges] = useState('')
  const [cursed, setCursed] = useState(false)

  // Combat Stats
  const [damage, setDamage] = useState('')
  const [damageType, setDamageType] = useState('')
  const [armorClassBonus, setArmorClassBonus] = useState('')

  // Description & Properties
  const [description, setDescription] = useState('')
  const [properties, setProperties] = useState('')
  const [history, setHistory] = useState('')
  const [lore, setLore] = useState('')

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
    }
  }, [user])

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name', { ascending: true})

      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('Error loading campaigns:', err)
    }
  }

  const handleAIGenerate = async (prompt: string) => {
    try {
      const result = await generateWithAI('item', prompt, false)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate')
      }

      const data = result.data

      setName(String(data.name || ''))
      setType(String(data.type || ''))
      setRarity(String(data.rarity || ''))
      setDescription(String(data.description || ''))
      setProperties(String(data.properties || ''))
      setValue(String(data.value || ''))
      setHistory(String(data.history || ''))
      setLore(String(data.lore || ''))
      setNotes(String(data.notes || ''))
    } catch (err) {
      console.error('Error generating item:', err)
      alert('Failed to generate item with AI. Please try again.')
    }
  }

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true)

      const promptParts = []
      if (name) promptParts.push(name)
      if (type) promptParts.push(type)
      if (rarity) promptParts.push(rarity)
      if (description) promptParts.push(description)
      if (properties) promptParts.push(properties)

      const imagePrompt = promptParts.join(', ')

      if (!imagePrompt.trim()) {
        alert('Please fill in some details about the item first (name, type, description, etc.)')
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
      const { error } = await supabase
        .from('items')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          type: type?.trim() || null,
          rarity: rarity?.trim() || null,
          value: value?.trim() || null,
          weight: weight?.trim() || null,
          attunement: attunement,
          requires_attunement_by: requiresAttunementBy?.trim() || null,
          charges: charges ? parseInt(charges) : null,
          cursed: cursed,
          damage: damage?.trim() || null,
          damage_type: damageType?.trim() || null,
          armor_class_bonus: armorClassBonus ? parseInt(armorClassBonus) : null,
          description: description?.trim() || null,
          properties: properties?.trim() || null,
          history: history?.trim() || null,
          lore: lore?.trim() || null,
          notes: notes?.trim() || null,
          image_url: imageUrl?.trim() || null,
          campaign_id: campaignId || null
        })

      if (error) throw error

      router.push('/app/world/items')
    } catch (err) {
      console.error('Error creating item:', err)
      alert('Failed to create item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2">
        <Link href="/app/world/items">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Items
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">New Item</h1>
          <p className="text-muted-foreground mt-2">Create a magical item or piece of loot</p>
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
            <CardDescription>Essential details about the item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Flametongue, Bag of Holding"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g., Weapon, Armor, Wondrous Item, Potion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rarity">Rarity</Label>
                <Select value={rarity || undefined} onValueChange={setRarity}>
                  <SelectTrigger id="rarity">
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Common">Common</SelectItem>
                    <SelectItem value="Uncommon">Uncommon</SelectItem>
                    <SelectItem value="Rare">Rare</SelectItem>
                    <SelectItem value="Very Rare">Very Rare</SelectItem>
                    <SelectItem value="Legendary">Legendary</SelectItem>
                    <SelectItem value="Artifact">Artifact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g., 500 GP, Priceless"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 3 lbs., Negligible"
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

        {/* Magical Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Magical Properties</CardTitle>
            <CardDescription>Attunement, charges, and curses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="attunement">Requires Attunement?</Label>
                <Select value={attunement ? 'true' : 'false'} onValueChange={(v) => setAttunement(v === 'true')}>
                  <SelectTrigger id="attunement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="charges">Charges</Label>
                <Input
                  id="charges"
                  type="number"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  placeholder="e.g., 7"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cursed">Cursed?</Label>
                <Select value={cursed ? 'true' : 'false'} onValueChange={(v) => setCursed(v === 'true')}>
                  <SelectTrigger id="cursed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {attunement && (
              <div className="space-y-2">
                <Label htmlFor="requiresAttunementBy">Attunement Requirements</Label>
                <Input
                  id="requiresAttunementBy"
                  value={requiresAttunementBy}
                  onChange={(e) => setRequiresAttunementBy(e.target.value)}
                  placeholder="e.g., by a spellcaster, by a wizard"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Combat Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Combat Statistics</CardTitle>
            <CardDescription>Weapon damage, armor bonuses, etc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="damage">Damage</Label>
                <Input
                  id="damage"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="e.g., 1d8, 2d6+3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="damageType">Damage Type</Label>
                <Input
                  id="damageType"
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  placeholder="e.g., Fire, Slashing, Necrotic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="armorClassBonus">AC Bonus</Label>
                <Input
                  id="armorClassBonus"
                  type="number"
                  value={armorClassBonus}
                  onChange={(e) => setArmorClassBonus(e.target.value)}
                  placeholder="e.g., +2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Description & Properties</CardTitle>
            <CardDescription>What the item does and how it works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Physical description of the item..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="properties">Properties & Effects</Label>
              <Textarea
                id="properties"
                value={properties}
                onChange={(e) => setProperties(e.target.value)}
                placeholder="Magical properties, special abilities, bonuses, effects..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* History & Lore */}
        <Card>
          <CardHeader>
            <CardTitle>History & Lore</CardTitle>
            <CardDescription>Background and stories about the item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="history">History</Label>
              <Textarea
                id="history"
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="Origin, creation, previous owners..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lore">Lore</Label>
              <Textarea
                id="lore"
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Legends, myths, hidden secrets..."
                rows={4}
              />
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
              label="Item Image"
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              onGenerateImage={handleGenerateImage}
              generatingImage={generatingImage}
              entityType="item"
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
            {saving ? 'Creating...' : 'Create Item'}
          </Button>
          <Link href="/app/world/items">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <AIGenerateDialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        type="item"
        onGenerate={handleAIGenerate}
      />
    </div>
  )
}
