'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'

interface CreateCampaignDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateCampaignDialog({ isOpen, onClose, onSuccess }: CreateCampaignDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dmName, setDmName] = useState('')
  const [playerNames, setPlayerNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const playersArray = playerNames
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)

      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name,
          description,
          dm_name: dmName,
          player_names: playersArray,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Reset form
      setName('')
      setDescription('')
      setDmName('')
      setPlayerNames('')

      // Close dialog
      onClose()

      // Callback
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-3xl font-bold">
            Create New Campaign
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Curse of Strahd"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A gothic horror adventure in Barovia..."
              disabled={loading}
              className="min-h-[100px] resize-vertical"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dmName">Dungeon Master Name *</Label>
            <Input
              id="dmName"
              type="text"
              value={dmName}
              onChange={(e) => setDmName(e.target.value)}
              placeholder="e.g., Matthew Mercer"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerNames">Player Names</Label>
            <Input
              id="playerNames"
              type="text"
              value={playerNames}
              onChange={(e) => setPlayerNames(e.target.value)}
              placeholder="Separate names with commas: Alice, Bob, Charlie"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter player names separated by commas
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
