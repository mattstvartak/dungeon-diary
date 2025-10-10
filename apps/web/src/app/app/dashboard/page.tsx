'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, formatDateTime, formatDate } from '@/lib/utils'
import {
  Mic,
  FileText,
  Upload,
  Sparkles,
  Scroll,
  Calendar,
  Clock,
  Users,
  MapPin,
  Sword,
  TrendingUp,
  ChevronRight,
  Play,
  BookOpen,
  Lightbulb,
  Dice6,
  Zap,
} from 'lucide-react'

interface DashboardData {
  userName: string
  nextSessionInfo: {
    campaignName: string
    daysUntil: number
    scheduledDate?: string
  } | null
  currentCampaign: {
    id: string
    name: string
    description: string | null
    cover_image_url: string | null
    player_names: string[]
    sessionCount: number
    lastSessionSummary: string | null
    lastSessionDate: string | null
    updated_at: string
  } | null
  recentSessions: Array<{
    id: string
    title: string
    session_number: number
    recorded_at: string
    duration_seconds: number
    status: string
    summary: string | null
    campaign: {
      name: string
    }
  }>
  aiInsights: {
    unresolvedThreads: string[]
    topNPCs: Array<{ name: string; mentions: number }>
    topLocations: Array<{ name: string; visits: number }>
    themes: string[]
    recentLoot: string[]
  }
  stats: {
    totalSessions: number
    totalHours: number
    totalCampaigns: number
    aiSummariesGenerated: number
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Fetch all campaigns with session counts
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          sessions(*)
        `)
        .order('updated_at', { ascending: false })

      if (campaignsError) throw campaignsError

      // Get current (most recently updated) campaign
      const currentCampaign = campaigns?.[0]
      const sessionCount = currentCampaign?.sessions?.length || 0

      // Get last session for current campaign
      const lastSession = currentCampaign?.sessions?.[0]

      // Fetch all sessions for stats
      const { data: allSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .order('recorded_at', { ascending: false })

      if (sessionsError) throw sessionsError

      // Calculate stats
      const totalHours = allSessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0
      const completedSessions = allSessions?.filter(s => s.status === 'completed') || []
      const aiSummariesCount = completedSessions.filter(s => s.summary).length

      // Extract AI insights
      const allNPCs: Record<string, number> = {}
      const allLocations: Record<string, number> = {}
      const allThemes: string[] = []
      const allLoot: string[] = []

      completedSessions.forEach(session => {
        if (session.npcs_mentioned) {
          session.npcs_mentioned.forEach((npc: string) => {
            allNPCs[npc] = (allNPCs[npc] || 0) + 1
          })
        }
        if (session.locations_mentioned) {
          session.locations_mentioned.forEach((loc: string) => {
            allLocations[loc] = (allLocations[loc] || 0) + 1
          })
        }
        if (session.loot_acquired) {
          allLoot.push(...session.loot_acquired)
        }
      })

      const topNPCs = Object.entries(allNPCs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, mentions]) => ({ name, mentions }))

      const topLocations = Object.entries(allLocations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, visits]) => ({ name, visits }))

      setData({
        userName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Dungeon Master',
        nextSessionInfo: currentCampaign ? {
          campaignName: currentCampaign.name,
          daysUntil: 2, // This would be calculated from actual scheduled date
        } : null,
        currentCampaign: currentCampaign ? {
          id: currentCampaign.id,
          name: currentCampaign.name,
          description: currentCampaign.description,
          cover_image_url: currentCampaign.cover_image_url,
          player_names: currentCampaign.player_names || [],
          sessionCount,
          lastSessionSummary: lastSession?.summary,
          lastSessionDate: lastSession?.recorded_at,
          updated_at: currentCampaign.updated_at,
        } : null,
        recentSessions: allSessions?.slice(0, 6) || [],
        aiInsights: {
          unresolvedThreads: [
            'The mysterious artifact discovered in the goblin fortress',
            'Who is the hooded figure following the party?',
            'The missing scholar from Waterdeep',
          ],
          topNPCs,
          topLocations,
          themes: ['Ancient Magic', 'Betrayal', 'Political Intrigue', 'Lost Civilizations'],
          recentLoot: allLoot.slice(-5).reverse(),
        },
        stats: {
          totalSessions: allSessions?.length || 0,
          totalHours: Math.round(totalHours / 3600),
          totalCampaigns: campaigns?.length || 0,
          aiSummariesGenerated: aiSummariesCount,
        },
      })
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading your adventure...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold">
          Welcome back, {data.userName}
        </h1>
        {data.nextSessionInfo ? (
          <p className="text-muted-foreground mt-2 text-lg">
            Your next session begins in {data.nextSessionInfo.daysUntil} days — {data.nextSessionInfo.campaignName} awaits.
          </p>
        ) : (
          <p className="text-muted-foreground mt-2 text-lg">
            Ready to start your next adventure?
          </p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/app/campaigns">
          <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">Start Recording</p>
              <p className="text-xs text-muted-foreground mt-1">Begin new session</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold">Add Note</p>
            <p className="text-xs text-muted-foreground mt-1">Quick idea capture</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold">Upload Audio</p>
            <p className="text-xs text-muted-foreground mt-1">Past session file</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold">Generate Summary</p>
            <p className="text-xs text-muted-foreground mt-1">AI-powered recap</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Campaign Snapshot */}
          {data.currentCampaign && (
            <Card className="border-2 border-primary/50 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Scroll className="h-6 w-6 text-primary" />
                      {data.currentCampaign.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {data.currentCampaign.description || 'An epic adventure unfolds...'}
                    </CardDescription>
                  </div>
                  <Link href={`/app/campaigns/${data.currentCampaign.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Campaign
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Session Count & Players */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {data.currentCampaign.sessionCount} Sessions Recorded
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {data.currentCampaign.player_names.length} Players
                    </span>
                  </div>
                </div>

                {/* Players List */}
                {data.currentCampaign.player_names.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Party Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.currentCampaign.player_names.map((name, idx) => (
                        <Badge key={idx} variant="secondary" className="px-3 py-1">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Session Summary */}
                {data.currentCampaign.lastSessionSummary && (
                  <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Last Session Summary
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      "{data.currentCampaign.lastSessionSummary}"
                    </p>
                    {data.currentCampaign.lastSessionDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDateTime(data.currentCampaign.lastSessionDate)}
                      </p>
                    )}
                  </div>
                )}

                {/* Next Session Countdown */}
                {data.nextSessionInfo && (
                  <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Next Session</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      in {data.nextSessionInfo.daysUntil}d 4h
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Sessions Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sessions</CardTitle>
                <Link href="/app/sessions">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start recording your first session!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.recentSessions.map((session) => (
                    <Link key={session.id} href={`/app/sessions/${session.id}`}>
                      <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center">
                              {session.session_number}
                            </div>
                            <Badge variant={
                              session.status === 'completed' ? 'default' :
                              session.status === 'processing' ? 'secondary' : 'outline'
                            }>
                              {session.status === 'completed' && '✅'}
                              {session.status === 'processing' && '🔄'}
                              {session.status === 'recording' && '⏺️'}
                              {' '}{session.status}
                            </Badge>
                          </div>
                          <CardTitle className="text-base line-clamp-1">
                            {session.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {session.campaign.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {session.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {session.summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(session.duration_seconds)}
                            </span>
                            <span>{formatDate(session.recorded_at)}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {session.status === 'completed' && (
                              <>
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Summary
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Transcript
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data.stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data.stats.totalHours}h</div>
                <p className="text-xs text-muted-foreground mt-1">Hours Played</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data.stats.totalCampaigns}</div>
                <p className="text-xs text-muted-foreground mt-1">Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data.stats.aiSummariesGenerated}</div>
                <p className="text-xs text-muted-foreground mt-1">AI Summaries</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Unresolved Story Threads */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Unresolved Threads
                </p>
                <div className="space-y-2">
                  {data.aiInsights.unresolvedThreads.slice(0, 3).map((thread, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{thread}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Top NPCs */}
              {data.aiInsights.topNPCs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Most Mentioned NPCs
                  </p>
                  <div className="space-y-2">
                    {data.aiInsights.topNPCs.slice(0, 3).map((npc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{npc.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {npc.mentions}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.aiInsights.topNPCs.length > 0 && <Separator />}

              {/* Recurring Themes */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recurring Themes
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.aiInsights.themes.slice(0, 4).map((theme, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Dice6 className="mr-2 h-4 w-4" />
                Dice Roller
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Random NPC Generator
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MapPin className="mr-2 h-4 w-4" />
                Random Location
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Sword className="mr-2 h-4 w-4" />
                Loot Generator
              </Button>
            </CardContent>
          </Card>

          {/* World Information */}
          {data.aiInsights.topLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Frequent Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.aiInsights.topLocations.slice(0, 5).map((location, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </div>
                        <span>{location.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{location.visits}x</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Loot */}
          {data.aiInsights.recentLoot.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sword className="h-4 w-4" />
                  Recent Loot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.aiInsights.recentLoot.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
