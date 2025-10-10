'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, X, Plus, Trash2, Edit, Save } from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
}

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[]
  is_lorebook: boolean
  campaign_id: string | null
  created_at: string
  updated_at: string
}

export default function NoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const noteId = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (user && noteId) {
      loadNote()
      loadCampaigns()
    }
  }, [user, noteId])

  const loadNote = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()

      if (error) throw error

      setNote(data)
      setTitle(data.title)
      setContent(data.content || '')
      setCampaignId(data.campaign_id || '')
      setTags(data.tags || [])
    } catch (err) {
      console.error('Error loading note:', err)
      alert('Failed to load note')
      router.push('/app/notes')
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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: title.trim(),
          content: content.trim() || null,
          campaign_id: campaignId || null,
          tags
        })
        .eq('id', noteId)

      if (error) throw error

      await loadNote()
      setEditing(false)
    } catch (err) {
      console.error('Error updating note:', err)
      alert('Failed to update note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      router.push(note?.is_lorebook ? '/app/notes/lorebook' : '/app/notes')
    } catch (err) {
      console.error('Error deleting note:', err)
      alert('Failed to delete note. Please try again.')
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || '')
      setCampaignId(note.campaign_id || '')
      setTags(note.tags || [])
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading note...</div>
      </div>
    )
  }

  if (!note) {
    return null
  }

  const backUrl = note.is_lorebook ? '/app/notes/lorebook' : '/app/notes'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {note.is_lorebook ? 'Lorebook' : 'Notes'}
          </Button>
        </Link>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
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
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          ) : (
            <CardTitle className="text-2xl">{note.title}</CardTitle>
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
                <span className="text-sm text-muted-foreground">Campaign: </span>
                <span className="text-sm font-medium">
                  {campaigns.find(c => c.id === campaignId)?.name || 'Unknown'}
                </span>
              </div>
            )
          )}

          {/* Content */}
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="resize-y"
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {note.content ? (
                <p className="whitespace-pre-wrap">{note.content}</p>
              ) : (
                <p className="text-muted-foreground italic">No content</p>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {editing ? (
              <>
                <div className="flex gap-2">
                  <Input
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
                  <div className="flex flex-wrap gap-2">
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
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          {!editing && (
            <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
              <div>Created: {formatDateTime(note.created_at)}</div>
              <div>Last updated: {formatDateTime(note.updated_at)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
