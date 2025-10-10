'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  description: string | null
  player_names: string[]
  dm_name: string
  created_at: string
  updated_at: string
  cover_image_url: string | null
}

interface Session {
  id: string
  campaign_id: string
  title: string
  session_number: number
  recorded_at: string
  duration_seconds: number
  status: 'recording' | 'processing' | 'completed' | 'failed'
  summary: string | null
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      loadCampaignData()
    }
  }, [user, params.id])

  const loadCampaignData = async () => {
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', params.id)
        .order('session_number', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])
    } catch (err) {
      console.error('Error loading campaign:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This will also delete all sessions.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/app/campaigns')
    } catch (err) {
      console.error('Error deleting campaign:', err)
      alert('Failed to delete campaign')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Campaign not found</h2>
          <p className="text-muted-foreground mb-4">This campaign might have been deleted.</p>
          <Link href="/app/campaigns">
            <Button>Back to Campaigns</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href="/app/campaigns" className="text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Campaigns
          </Link>
          <h1 className="font-heading text-4xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-muted-foreground mt-2">{campaign.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            ✏️ Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDeleteCampaign}>
            🗑️ Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Dungeon Master</p>
              <p className="text-foreground font-semibold">{campaign.dm_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Created</p>
              <p className="text-foreground">{formatDate(campaign.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Updated</p>
              <p className="text-foreground">{formatDate(campaign.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.player_names.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.player_names.map((player, index) => (
                  <Badge key={index} variant="secondary">
                    {player}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No players added</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Total Sessions</p>
              <p className="text-foreground font-semibold text-2xl">{sessions.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Playtime</p>
              <p className="text-foreground font-semibold text-2xl">
                {formatDuration(sessions.reduce((acc, s) => acc + s.duration_seconds, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Sessions</h2>
          <Link href={`/app/campaigns/${params.id}/record`}>
            <Button>
              <span className="mr-2">🎙️</span>
              New Session
            </Button>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎙️</div>
                <h3 className="text-xl font-semibold mb-2">No sessions recorded</h3>
                <p className="text-muted-foreground mb-6">
                  Start recording your first session to build your campaign chronicle!
                </p>
                <Link href={`/app/campaigns/${params.id}/record`}>
                  <Button>
                    <span className="mr-2">🎙️</span>
                    Record First Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Link key={session.id} href={`/app/sessions/${session.id}`}>
                <Card className="hover:bg-card-hover transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl font-bold">
                            Session {session.session_number}: {session.title}
                          </h3>
                          <Badge variant={
                            session.status === 'completed' ? 'default' :
                            session.status === 'failed' ? 'destructive' :
                            'secondary'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📅 {formatDate(session.recorded_at)}</span>
                          <span>⏱️ {formatDuration(session.duration_seconds)}</span>
                        </div>
                        {session.summary && (
                          <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                            {session.summary}
                          </p>
                        )}
                      </div>
                      <div className="text-2xl">▶️</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
