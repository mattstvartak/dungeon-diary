'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles } from 'lucide-react'

interface AIGenerateDialogProps {
  open: boolean
  onClose: () => void
  type: 'npc' | 'location' | 'item'
  onGenerate: (prompt: string, fullDetails?: boolean) => Promise<void>
}

export function AIGenerateDialog({ open, onClose, type, onGenerate }: AIGenerateDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async (fullDetails: boolean = false) => {
    setGenerating(true)
    try {
      await onGenerate(prompt.trim(), fullDetails)
      setPrompt('')
      onClose()
    } catch (err) {
      console.error('Error generating:', err)
    } finally {
      setGenerating(false)
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'npc':
        return 'e.g., A mysterious elven wizard who runs a magic shop in Waterdeep'
      case 'location':
        return 'e.g., A haunted forest with ancient ruins and magical creatures'
      case 'item':
        return 'e.g., A legendary sword that glows blue when enemies are near'
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'npc':
        return 'Generate NPC with AI'
      case 'location':
        return 'Generate Location with AI'
      case 'item':
        return 'Generate Item with AI'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'npc':
        return 'Describe the NPC you want to create and AI will generate the details'
      case 'location':
        return 'Describe the location you want to create, or leave blank for a random AI-generated location'
      case 'item':
        return 'Describe the item you want to create and AI will generate the details'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Description {type === 'location' && <span className="text-muted-foreground font-normal">(Optional)</span>}</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
              disabled={generating}
            />
            {type === 'location' && (
              <p className="text-xs text-muted-foreground">
                Leave blank to let AI create a completely random location
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          {type === 'location' && (
            <Button
              variant="secondary"
              onClick={() => handleGenerate(true)}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Full Details
                </>
              )}
            </Button>
          )}
          <Button onClick={() => handleGenerate(false)} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
