'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { CreateCampaignDialog } from '@/components/create-campaign-dialog'
import { formatDate } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  description: string | null
  player_names: string[]
  dm_name: string
  created_at: string
  updated_at: string
  sessions?: { count: number }[]
}

export default function CampaignsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          sessions(count)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])
    } catch (err) {
      console.error('Error loading campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    loadCampaigns()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-2">Manage your adventures</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <span className="mr-2">➕</span>
          New Campaign
        </Button>
      </div>

      {/* Campaign Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first campaign to start chronicling your adventures!
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <span className="mr-2">➕</span>
                Create Your First Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const sessionCount = campaign.sessions?.[0]?.count || 0

            return (
              <Link key={campaign.id} href={`/app/campaigns/${campaign.id}`}>
                <Card className="border-2 border-primary hover:border-primary hover:shadow-lg-primary transition-all cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {campaign.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>👥 Players: {campaign.player_names.length > 0 ? campaign.player_names.join(', ') : 'None added'}</p>
                      <p>🎭 DM: {campaign.dm_name}</p>
                      <p>📅 Created: {formatDate(campaign.created_at)}</p>
                      <p className="text-primary font-semibold">
                        📊 {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
