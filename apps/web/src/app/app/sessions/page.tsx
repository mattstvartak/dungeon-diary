'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, formatDateTime } from '@/lib/utils'

interface Session {
  id: string
  campaign_id: string
  title: string
  session_number: number
  recorded_at: string
  duration_seconds: number
  status: 'recording' | 'processing' | 'completed' | 'failed'
  campaign: {
    name: string
  }
}

export default function SessionsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSessions(filtered)
    } else {
      setFilteredSessions(sessions)
    }
  }, [searchQuery, sessions])

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .order('recorded_at', { ascending: false })

      if (error) throw error

      setSessions(data || [])
      setFilteredSessions(data || [])
    } catch (err) {
      console.error('Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'completed'
      case 'processing': return 'processing'
      case 'recording': return 'recording'
      case 'failed': return 'failed'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading sessions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold">All Sessions</h1>
        <p className="text-muted-foreground mt-2">Browse and search all your D&D sessions</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <Input
            type="search"
            placeholder="Search sessions by title or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No sessions found' : 'No sessions yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Record your first session to get started!'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Link key={session.id} href={`/app/sessions/${session.id}`}>
              <Card className="hover:border-primary hover:shadow-lg-primary transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {/* Session Number */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary font-bold text-xl flex-shrink-0">
                      {session.session_number}
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {session.title}
                        </h3>
                        <Badge variant={getStatusColor(session.status) as any}>
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Campaign: {session.campaign.name}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>⏱️ {formatDuration(session.duration_seconds)}</span>
                        <span>📅 {formatDateTime(session.recorded_at)}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-muted-foreground flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {sessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-warning">
                  {sessions.filter(s => s.status === 'processing').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">
                  {Math.round(sessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 3600)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
