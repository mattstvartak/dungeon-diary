'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setName(profileData.name)
      setEmail(profileData.email)

      // Load usage data for current month
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .eq('month', currentMonth)
        .single()

      setUsage(usageData)
    } catch (err: any) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name, email })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  // Free tier limits
  const FREE_TIER_LIMITS = {
    sessions: 3,
    recaps: 2,
  }

  const sessionsUsed = usage?.sessions_recorded || 0
  const recapsUsed = usage?.ai_recaps_generated || 0
  const isPremium = profile?.subscription_tier === 'premium'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={saving}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan and billing information</CardDescription>
            </div>
            <Badge variant={isPremium ? 'completed' : 'default'}>
              {isPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Plan */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </h3>

              {isPremium ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">$9.99/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span className="font-semibold">
                      {profile?.subscription_expires_at
                        ? new Date(profile.subscription_expires_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button variant="destructive" className="w-full">
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    You're currently on the free plan. Upgrade to Premium for unlimited sessions and AI features!
                  </p>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-primary">Premium Features</h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>✓ Unlimited campaigns</li>
                      <li>✓ Unlimited session recordings</li>
                      <li>✓ Unlimited AI recaps</li>
                      <li>✓ Permanent transcript storage</li>
                      <li>✓ Advanced AI features</li>
                      <li>✓ Priority processing</li>
                      <li>✓ Export to PDF/Markdown</li>
                      <li>✓ Player sharing links</li>
                    </ul>
                  </div>

                  <Button className="w-full shadow-lg">
                    Upgrade to Premium - $9.99/month
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>
            {isPremium ? 'Unlimited usage on Premium plan' : 'Your free tier usage limits'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sessions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Session Recordings</span>
                <span className="text-sm text-muted-foreground">
                  {isPremium ? `${sessionsUsed} sessions` : `${sessionsUsed} / ${FREE_TIER_LIMITS.sessions}`}
                </span>
              </div>
              {!isPremium && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-secondary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((sessionsUsed / FREE_TIER_LIMITS.sessions) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* AI Recaps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">AI Recaps</span>
                <span className="text-sm text-muted-foreground">
                  {isPremium ? `${recapsUsed} recaps` : `${recapsUsed} / ${FREE_TIER_LIMITS.recaps}`}
                </span>
              </div>
              {!isPremium && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-secondary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((recapsUsed / FREE_TIER_LIMITS.recaps) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Transcription Minutes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Transcription Minutes</span>
                <span className="text-sm text-muted-foreground">
                  {usage?.transcription_minutes || 0} minutes
                </span>
              </div>
            </div>

            {/* Storage Used */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Storage Used</span>
                <span className="text-sm text-muted-foreground">
                  {(usage?.storage_used_mb || 0).toFixed(2)} MB
                </span>
              </div>
            </div>

            {!isPremium && sessionsUsed >= FREE_TIER_LIMITS.sessions && (
              <div className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-lg text-sm">
                <strong>Limit Reached:</strong> You've used all your free sessions this month.
                Upgrade to Premium for unlimited sessions!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive">
                Delete My Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
