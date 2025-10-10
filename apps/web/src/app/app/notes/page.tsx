'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { FileText, Plus, Search, BookOpen } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  is_lorebook: boolean
  campaign: {
    name: string
  } | null
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredNotes(filtered)
    } else {
      setFilteredNotes(notes)
    }
  }, [searchQuery, notes])

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .eq('is_lorebook', false)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setNotes(data || [])
      setFilteredNotes(data || [])
    } catch (err) {
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">Your personal campaign notes</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/notes/lorebook">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Lorebook
            </Button>
          </Link>
          <Link href="/app/notes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start creating notes to keep track of your campaign details!'}
              </p>
              {!searchQuery && (
                <Link href="/app/notes/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Note
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Link key={note.id} href={`/app/notes/${note.id}`}>
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{note.title}</span>
                  </CardTitle>
                  {note.campaign && (
                    <CardDescription className="text-xs">
                      Campaign: {note.campaign.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  )}

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Updated {formatDateTime(note.updated_at)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
