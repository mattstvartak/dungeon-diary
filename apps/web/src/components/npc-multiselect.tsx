'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { generateNPC } from '@/actions/generate'

interface NPC {
  id: string
  name: string
  npc_type: string | null
  race: string | null
  class_or_occupation: string | null
}

interface NPCMultiSelectProps {
  campaignId?: string
  selectedNpcIds: string[]
  onSelectionChange: (npcIds: string[]) => void
}

export function NPCMultiSelect({ campaignId, selectedNpcIds, onSelectionChange }: NPCMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('')
  const [newRace, setNewRace] = useState('')
  const [newOccupation, setNewOccupation] = useState('')

  // Generate form state
  const [generatePrompt, setGeneratePrompt] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadNPCs()
  }, [campaignId])

  const loadNPCs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('npcs')
        .select('id, name, npc_type, race, class_or_occupation')
        .order('name', { ascending: true })

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error } = await query

      if (error) throw error
      setNpcs(data || [])
    } catch (err) {
      console.error('Error loading NPCs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNPC = async () => {
    if (!newName.trim() || !newType) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('npcs')
        .insert({
          user_id: user.id,
          campaign_id: campaignId || null,
          name: newName.trim(),
          npc_type: newType,
          race: newRace.trim() || null,
          class_or_occupation: newOccupation.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      // Add to list and select
      if (data) {
        setNpcs(prev => [data, ...prev])
        onSelectionChange([...selectedNpcIds, data.id])
      }

      // Reset form
      setNewName('')
      setNewType('')
      setNewRace('')
      setNewOccupation('')
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Error creating NPC:', err)
      alert('Failed to create NPC')
    } finally {
      setCreating(false)
    }
  }

  const handleGenerateNPC = async () => {
    if (!generatePrompt.trim()) return

    setGenerating(true)
    try {
      // Call server action to generate NPC
      const result = await generateNPC(generatePrompt)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate NPC')
      }

      const data = result.data

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: npcData, error } = await supabase
        .from('npcs')
        .insert({
          user_id: user.id,
          campaign_id: campaignId || null,
          name: data.name || '',
          npc_type: data.npc_type || null,
          race: data.race || null,
          class_or_occupation: data.class_or_occupation || null,
          description: data.description || null,
          personality: data.personality || null,
          appearance: data.appearance || null
        })
        .select()
        .single()

      if (error) throw error

      // Add to list and select
      if (npcData) {
        setNpcs(prev => [npcData, ...prev])
        onSelectionChange([...selectedNpcIds, npcData.id])
      }

      // Reset form
      setGeneratePrompt('')
      setShowGenerateDialog(false)
    } catch (err) {
      console.error('Error generating NPC:', err)
      alert('Failed to generate NPC')
    } finally {
      setGenerating(false)
    }
  }

  const selectedNpcs = npcs.filter(npc => selectedNpcIds.includes(npc.id))

  const toggleNpc = (npcId: string) => {
    if (selectedNpcIds.includes(npcId)) {
      onSelectionChange(selectedNpcIds.filter(id => id !== npcId))
    } else {
      onSelectionChange([...selectedNpcIds, npcId])
    }
  }

  const removeNpc = (npcId: string) => {
    onSelectionChange(selectedNpcIds.filter(id => id !== npcId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedNpcs.length > 0
              ? `${selectedNpcs.length} NPC${selectedNpcs.length > 1 ? 's' : ''} selected`
              : 'Select NPCs...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search NPCs..." />
            <CommandEmpty>
              <div className="py-6 text-center text-sm text-muted-foreground">
                No NPCs found. Create one below!
              </div>
            </CommandEmpty>
            {npcs.length > 0 && (
              <CommandGroup className="max-h-64 overflow-auto">
                {npcs.map((npc) => (
                  <CommandItem
                    key={npc.id}
                    value={npc.name}
                    onSelect={() => toggleNpc(npc.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedNpcIds.includes(npc.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{npc.name}</span>
                        {npc.npc_type && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {npc.npc_type}
                          </span>
                        )}
                      </div>
                      {(npc.race || npc.class_or_occupation) && (
                        <span className="text-xs text-muted-foreground">
                          {[npc.race, npc.class_or_occupation].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && npcs.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No NPCs available yet. Create one below!
              </div>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setShowCreateDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New NPC</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setShowGenerateDialog(true)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Generate NPC with AI</span>
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedNpcs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNpcs.map((npc) => (
            <Badge key={npc.id} variant="secondary" className="gap-1">
              {npc.name}
              <button
                type="button"
                onClick={() => removeNpc(npc.id)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Create NPC Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New NPC</DialogTitle>
            <DialogDescription>
              Quickly create a new NPC with basic information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name *</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Elara Moonwhisper"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-type">Type *</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger id="new-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ally">Ally</SelectItem>
                  <SelectItem value="Enemy">Enemy</SelectItem>
                  <SelectItem value="Boss">Boss (BBEG)</SelectItem>
                  <SelectItem value="Shopkeeper">Shopkeeper</SelectItem>
                  <SelectItem value="Innkeeper">Innkeeper</SelectItem>
                  <SelectItem value="Bartender">Bartender</SelectItem>
                  <SelectItem value="Quest Giver">Quest Giver</SelectItem>
                  <SelectItem value="Guard">Guard</SelectItem>
                  <SelectItem value="Merchant">Merchant</SelectItem>
                  <SelectItem value="Noble">Noble</SelectItem>
                  <SelectItem value="Commoner">Commoner</SelectItem>
                  <SelectItem value="Patron">Patron</SelectItem>
                  <SelectItem value="Contact">Contact</SelectItem>
                  <SelectItem value="Informant">Informant</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-race">Race (Optional)</Label>
              <Input
                id="new-race"
                value={newRace}
                onChange={(e) => setNewRace(e.target.value)}
                placeholder="e.g., High Elf, Human, Tiefling"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-occupation">Class/Occupation (Optional)</Label>
              <Input
                id="new-occupation"
                value={newOccupation}
                onChange={(e) => setNewOccupation(e.target.value)}
                placeholder="e.g., Wizard, Merchant, Guard Captain"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNPC} disabled={creating || !newName.trim() || !newType}>
              {creating ? 'Creating...' : 'Create NPC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate NPC Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate NPC with AI</DialogTitle>
            <DialogDescription>
              Describe the NPC you want to create and AI will generate the details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generate-prompt">Description</Label>
              <Textarea
                id="generate-prompt"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., A gruff dwarven blacksmith who secretly helps the resistance"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateNPC} disabled={generating || !generatePrompt.trim()}>
              {generating ? 'Generating...' : 'Generate NPC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
