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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { generatePOI } from '@/actions/generate'

interface POI {
  id: string
  name: string
  type: string | null
  location_id: string
}

interface Location {
  id: string
  name: string
}

interface POIMultiSelectProps {
  campaignId?: string
  locationId?: string // Filter POIs by location
  selectedPoiIds: string[]
  onSelectionChange: (poiIds: string[]) => void
}

export function POIMultiSelect({ campaignId, locationId, selectedPoiIds, onSelectionChange }: POIMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Create/Generate dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('')
  const [newLocationId, setNewLocationId] = useState(locationId || '')
  const [newDescription, setNewDescription] = useState('')

  // Generate form state
  const [generatePrompt, setGeneratePrompt] = useState('')

  // Locations for dropdown
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    loadPOIs()
    loadLocations()
  }, [campaignId, locationId])

  const loadPOIs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('pois')
        .select('id, name, type, location_id')
        .order('name', { ascending: true })

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error } = await query

      if (error) throw error
      setPois(data || [])
    } catch (err) {
      console.error('Error loading POIs:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedPois = pois.filter(poi => selectedPoiIds.includes(poi.id))

  const togglePoi = (poiId: string) => {
    if (selectedPoiIds.includes(poiId)) {
      onSelectionChange(selectedPoiIds.filter(id => id !== poiId))
    } else {
      onSelectionChange([...selectedPoiIds, poiId])
    }
  }

  const removePoi = (poiId: string) => {
    onSelectionChange(selectedPoiIds.filter(id => id !== poiId))
  }

  const loadLocations = async () => {
    try {
      let query = supabase
        .from('locations')
        .select('id, name')
        .order('name', { ascending: true })

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error } = await query

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      console.error('Error loading locations:', err)
    }
  }

  const handleCreatePOI = async () => {
    if (!newName.trim() || !newLocationId) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('pois')
        .insert({
          user_id: user.id,
          campaign_id: campaignId || null,
          name: newName.trim(),
          type: newType || null,
          location_id: newLocationId,
          description: newDescription.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setPois(prev => [data, ...prev])
        onSelectionChange([...selectedPoiIds, data.id])
      }

      // Reset form
      setNewName('')
      setNewType('')
      setNewLocationId(locationId || '')
      setNewDescription('')
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Error creating POI:', err)
      alert('Failed to create POI')
    } finally {
      setCreating(false)
    }
  }

  const handleGeneratePOI = async () => {
    if (!generatePrompt.trim() || !newLocationId) return

    setGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call server action to generate POI
      const result = await generatePOI(generatePrompt)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate POI')
      }

      const generatedData = result.data

      // Create POI in database
      const { data, error } = await supabase
        .from('pois')
        .insert({
          user_id: user.id,
          campaign_id: campaignId || null,
          location_id: newLocationId,
          name: generatedData.name,
          type: generatedData.type || null,
          description: generatedData.description || null
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setPois(prev => [data, ...prev])
        onSelectionChange([...selectedPoiIds, data.id])
      }

      // Reset form
      setGeneratePrompt('')
      setNewLocationId(locationId || '')
      setShowGenerateDialog(false)
    } catch (err) {
      console.error('Error generating POI:', err)
      alert('Failed to generate POI')
    } finally {
      setGenerating(false)
    }
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
            {selectedPois.length > 0
              ? `${selectedPois.length} POI${selectedPois.length > 1 ? 's' : ''} selected`
              : 'Select Points of Interest...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search POIs..." />
            <CommandEmpty>
              <div className="py-6 text-center text-sm text-muted-foreground">
                No POIs found. Create one below!
              </div>
            </CommandEmpty>
            {pois.length > 0 && (
              <CommandGroup className="max-h-64 overflow-auto">
                {pois.map((poi) => (
                  <CommandItem
                    key={poi.id}
                    value={poi.name}
                    onSelect={() => togglePoi(poi.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedPoiIds.includes(poi.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{poi.name}</span>
                        {poi.type && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {poi.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && pois.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No POIs available yet. Create one below!
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
                <span>Create New POI</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setShowGenerateDialog(true)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Generate POI with AI</span>
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedPois.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPois.map((poi) => (
            <Badge key={poi.id} variant="secondary" className="gap-1">
              {poi.name}
              {poi.type && <span className="text-xs opacity-70">• {poi.type}</span>}
              <button
                type="button"
                onClick={() => removePoi(poi.id)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Create POI Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New POI</DialogTitle>
            <DialogDescription>
              Add a new point of interest to your world.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-poi-name">Name *</Label>
              <Input
                id="new-poi-name"
                placeholder="The Prancing Pony"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-poi-type">Type</Label>
              <Input
                id="new-poi-type"
                placeholder="Inn & Tavern"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-poi-location">Location *</Label>
              <Select
                value={newLocationId}
                onValueChange={setNewLocationId}
                disabled={!!locationId}
              >
                <SelectTrigger id="new-poi-location">
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locationId && (
                <p className="text-xs text-muted-foreground">
                  Location is pre-selected based on context
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-poi-description">Description</Label>
              <Textarea
                id="new-poi-description"
                placeholder="A cozy inn with excellent ale..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePOI} disabled={creating || !newName.trim() || !newLocationId}>
              {creating ? 'Creating...' : 'Create POI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate POI Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate POI with AI</DialogTitle>
            <DialogDescription>
              Describe the point of interest you want to create and AI will generate the details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generate-poi-location">Location *</Label>
              <Select
                value={newLocationId}
                onValueChange={setNewLocationId}
                disabled={!!locationId}
              >
                <SelectTrigger id="generate-poi-location">
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locationId && (
                <p className="text-xs text-muted-foreground">
                  Location is pre-selected based on context
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="generate-poi-prompt">Description</Label>
              <Textarea
                id="generate-poi-prompt"
                placeholder="A mysterious magic shop run by an eccentric wizard..."
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button onClick={handleGeneratePOI} disabled={generating || !generatePrompt.trim() || !newLocationId}>
              {generating ? 'Generating...' : 'Generate POI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
