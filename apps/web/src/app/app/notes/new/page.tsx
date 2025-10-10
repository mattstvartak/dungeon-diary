'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, X, Plus } from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
}

export default function NewNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient()
  const isLorebook = searchParams.get('lorebook') === 'true'

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          content: content.trim() || null,
          campaign_id: campaignId || null,
          tags,
          is_lorebook: isLorebook
        })

      if (error) throw error

      router.push(isLorebook ? '/app/notes/lorebook' : '/app/notes')
    } catch (err) {
      console.error('Error creating note:', err)
      alert('Failed to create note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={isLorebook ? '/app/notes/lorebook' : '/app/notes'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold">
          {isLorebook ? 'New Lorebook Entry' : 'New Note'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLorebook ? 'Add to your world-building encyclopedia' : 'Create a new campaign note'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isLorebook ? 'e.g., The Dragon Isles' : 'e.g., Session prep ideas'}
                required
              />
            </div>

            {/* Campaign */}
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

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isLorebook ? 'Describe this entry...' : 'Write your notes...'}
                rows={12}
                className="resize-y"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add a tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
              <Link href={isLorebook ? '/app/notes/lorebook' : '/app/notes'}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
