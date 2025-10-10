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
import { BookOpen, Plus, Search, ArrowLeft } from 'lucide-react'

interface LorebookEntry {
  id: string
  title: string
  content: string
  tags: string[]
  campaign: {
    name: string
  } | null
  created_at: string
  updated_at: string
}

export default function LorebookPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [entries, setEntries] = useState<LorebookEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<LorebookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadLorebook()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries(entries)
    }
  }, [searchQuery, entries])

  const loadLorebook = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .eq('is_lorebook', true)
        .order('title', { ascending: true })

      if (error) throw error

      setEntries(data || [])
      setFilteredEntries(data || [])
    } catch (err) {
      console.error('Error loading lorebook:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading lorebook...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app/notes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Notes
              </Button>
            </Link>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Lorebook</h1>
          <p className="text-muted-foreground mt-2">
            Your world-building encyclopedia
          </p>
        </div>
        <Link href="/app/notes/new?lorebook=true">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search lorebook entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lorebook Entries */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No entries found' : 'Your lorebook is empty'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Build your world by adding lorebook entries for locations, NPCs, items, history, and more!'}
              </p>
              {!searchQuery && (
                <Link href="/app/notes/new?lorebook=true">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Entry
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <Link key={entry.id} href={`/app/notes/${entry.id}`}>
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{entry.title}</span>
                  </CardTitle>
                  {entry.campaign && (
                    <CardDescription className="text-xs">
                      Campaign: {entry.campaign.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {entry.content && (
                    <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
                      {entry.content}
                    </p>
                  )}

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Updated {formatDateTime(entry.updated_at)}
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
