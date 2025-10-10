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

interface Item {
  id: string
  name: string
  type: string | null
  rarity: string | null
  description: string | null
  properties: string | null
  value: string | null
  notes: string | null
  image_url: string | null
  campaign_id: string | null
  created_at: string
  updated_at: string
}

export default function ItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const itemId = params.id as string

  const [item, setItem] = useState<Item | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [rarity, setRarity] = useState('')
  const [description, setDescription] = useState('')
  const [properties, setProperties] = useState('')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')

  useEffect(() => {
    if (user && itemId) {
      loadItem()
      loadCampaigns()
    }
  }, [user, itemId])

  const loadItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error

      setItem(data)
      setName(data.name)
      setType(data.type || '')
      setRarity(data.rarity || '')
      setDescription(data.description || '')
      setProperties(data.properties || '')
      setValue(data.value || '')
      setNotes(data.notes || '')
      setImageUrl(data.image_url || '')
      setCampaignId(data.campaign_id || '')
    } catch (err) {
      console.error('Error loading item:', err)
      alert('Failed to load item')
      router.push('/app/world/items')
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
        .from('items')
        .update({
          name: name.trim(),
          type: type.trim() || null,
          rarity: rarity.trim() || null,
          description: description.trim() || null,
          properties: properties.trim() || null,
          value: value.trim() || null,
          notes: notes.trim() || null,
          image_url: imageUrl.trim() || null,
          campaign_id: campaignId || null
        })
        .eq('id', itemId)

      if (error) throw error

      await loadItem()
      setEditing(false)
    } catch (err) {
      console.error('Error updating item:', err)
      alert('Failed to update item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      router.push('/app/world/items')
    } catch (err) {
      console.error('Error deleting item:', err)
      alert('Failed to delete item. Please try again.')
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if (item) {
      setName(item.name)
      setType(item.type || '')
      setRarity(item.rarity || '')
      setDescription(item.description || '')
      setProperties(item.properties || '')
      setValue(item.value || '')
      setNotes(item.notes || '')
      setImageUrl(item.image_url || '')
      setCampaignId(item.campaign_id || '')
    }
    setEditing(false)
  }

  const getRarityVariant = (rarity: string | null) => {
    if (!rarity) return 'secondary'
    const r = rarity.toLowerCase()
    if (r.includes('legendary') || r.includes('artifact')) return 'default'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading item...</div>
      </div>
    )
  }

  if (!item) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/world/items">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Items
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
      {(item.image_url || editing) && (
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
          ) : item.image_url ? (
            <div className="h-64 w-full overflow-hidden bg-muted flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="max-w-full max-h-full object-contain"
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
                <Input
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
                />
              </div>
            </div>
          ) : (
            <div>
              <CardTitle className="text-2xl">{item.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.type && (
                  <Badge variant="secondary">{item.type}</Badge>
                )}
                {item.rarity && (
                  <Badge variant={getRarityVariant(item.rarity) as any}>
                    {item.rarity}
                  </Badge>
                )}
                {item.value && (
                  <Badge variant="outline" className="font-semibold">
                    {item.value}
                  </Badge>
                )}
              </div>
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
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.description || 'No description'}
              </p>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-2">
            <Label>Properties/Effects</Label>
            {editing ? (
              <Textarea
                value={properties}
                onChange={(e) => setProperties(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.properties || 'No properties noted'}
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
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.notes || 'No additional notes'}
              </p>
            )}
          </div>

          {/* Metadata */}
          {!editing && (
            <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
              <div>Created: {formatDateTime(item.created_at)}</div>
              <div>Last updated: {formatDateTime(item.updated_at)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
