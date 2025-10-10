'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface NPC {
  id: string
  name: string
  npc_type: string | null
  race: string | null
  class_or_occupation: string | null
  description: string | null
  personality: string | null
  appearance: string | null
  location: string | null
  relationship: string | null
  notes: string | null
  image_url: string | null
  campaign_id: string | null
  created_at: string
  updated_at: string
}

export default function NPCDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const npcId = params.id as string

  const [npc, setNpc] = useState<NPC | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [name, setName] = useState('')
  const [npcType, setNpcType] = useState('')
  const [race, setRace] = useState('')
  const [classOrOccupation, setClassOrOccupation] = useState('')
  const [description, setDescription] = useState('')
  const [personality, setPersonality] = useState('')
  const [appearance, setAppearance] = useState('')
  const [location, setLocation] = useState('')
  const [relationship, setRelationship] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')

  useEffect(() => {
    if (user && npcId) {
      loadNPC()
      loadCampaigns()
    }
  }, [user, npcId])

  const loadNPC = async () => {
    try {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('id', npcId)
        .single()

      if (error) throw error

      setNpc(data)
      setName(data.name)
      setNpcType(data.npc_type || '')
      setRace(data.race || '')
      setClassOrOccupation(data.class_or_occupation || '')
      setDescription(data.description || '')
      setPersonality(data.personality || '')
      setAppearance(data.appearance || '')
      setLocation(data.location || '')
      setRelationship(data.relationship || '')
      setNotes(data.notes || '')
      setImageUrl(data.image_url || '')
      setCampaignId(data.campaign_id || '')
    } catch (err) {
      console.error('Error loading NPC:', err)
      alert('Failed to load NPC')
      router.push('/app/world/npcs')
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
        .from('npcs')
        .update({
          name: name.trim(),
          npc_type: npcType.trim() || null,
          race: race.trim() || null,
          class_or_occupation: classOrOccupation.trim() || null,
          description: description.trim() || null,
          personality: personality.trim() || null,
          appearance: appearance.trim() || null,
          location: location.trim() || null,
          relationship: relationship.trim() || null,
          notes: notes.trim() || null,
          image_url: imageUrl.trim() || null,
          campaign_id: campaignId || null
        })
        .eq('id', npcId)

      if (error) throw error

      await loadNPC()
      setEditing(false)
    } catch (err) {
      console.error('Error updating NPC:', err)
      alert('Failed to update NPC. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this NPC? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('npcs')
        .delete()
        .eq('id', npcId)

      if (error) throw error

      router.push('/app/world/npcs')
    } catch (err) {
      console.error('Error deleting NPC:', err)
      alert('Failed to delete NPC. Please try again.')
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if (npc) {
      setName(npc.name)
      setRace(npc.race || '')
      setClassOrOccupation(npc.class_or_occupation || '')
      setDescription(npc.description || '')
      setPersonality(npc.personality || '')
      setAppearance(npc.appearance || '')
      setLocation(npc.location || '')
      setRelationship(npc.relationship || '')
      setNotes(npc.notes || '')
      setImageUrl(npc.image_url || '')
      setCampaignId(npc.campaign_id || '')
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading NPC...</div>
      </div>
    )
  }

  if (!npc) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/world/npcs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to NPCs
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

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={editing ? imageUrl : (npc.image_url || undefined)} />
              <AvatarFallback className="text-xl">
                {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
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
              ) : (
                <div>
                  <CardTitle className="text-2xl">{npc.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {npc.npc_type && (
                      <Badge variant="secondary">{npc.npc_type}</Badge>
                    )}
                    <p className="text-muted-foreground">
                      {[npc.race, npc.class_or_occupation].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="npcType">NPC Type</Label>
                <Select value={npcType} onValueChange={setNpcType}>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">Race</Label>
                <Input
                  id="race"
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class/Occupation</Label>
                <Input
                  id="class"
                  value={classOrOccupation}
                  onChange={(e) => setClassOrOccupation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Party</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {npc.location && (
                <Badge variant="secondary">📍 {npc.location}</Badge>
              )}
              {npc.relationship && (
                <Badge variant="outline">{npc.relationship}</Badge>
              )}
            </div>
          )}

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
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {npc.description || 'No description'}
              </p>
            )}
          </div>

          {/* Personality */}
          <div className="space-y-2">
            <Label>Personality</Label>
            {editing ? (
              <Textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {npc.personality || 'No personality notes'}
              </p>
            )}
          </div>

          {/* Appearance */}
          <div className="space-y-2">
            <Label>Appearance</Label>
            {editing ? (
              <Textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {npc.appearance || 'No appearance notes'}
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
                {npc.notes || 'No additional notes'}
              </p>
            )}
          </div>

          {/* Image URL */}
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          {/* Metadata */}
          {!editing && (
            <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
              <div>Created: {formatDateTime(npc.created_at)}</div>
              <div>Last updated: {formatDateTime(npc.updated_at)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
