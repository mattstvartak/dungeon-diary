'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Sword, Plus, Search } from 'lucide-react'

interface Item {
  id: string
  name: string
  type: string | null
  rarity: string | null
  description: string | null
  properties: string | null
  value: string | null
  image_url: string | null
  campaign: {
    name: string
  } | null
}

export default function ItemsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadItems()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rarity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [searchQuery, items])

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          campaign:campaigns(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      setItems(data || [])
      setFilteredItems(data || [])
    } catch (err) {
      console.error('Error loading items:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return 'secondary'
    const r = rarity.toLowerCase()
    if (r.includes('common')) return 'secondary'
    if (r.includes('uncommon')) return 'default'
    if (r.includes('rare')) return 'default'
    if (r.includes('very rare')) return 'default'
    if (r.includes('legendary')) return 'default'
    if (r.includes('artifact')) return 'destructive'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading items...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Items & Loot</h1>
          <p className="text-muted-foreground mt-2">
            Manage your treasure and equipment
          </p>
        </div>
        <Link href="/app/world/items/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Item
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
              placeholder="Search items by name, type, rarity, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sword className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No items found' : 'No items yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start adding items to track your loot and equipment!'}
              </p>
              {!searchQuery && (
                <Link href="/app/world/items/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Item
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/app/world/items/${item.id}`}>
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                {item.image_url && (
                  <div className="h-32 w-full overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <Sword className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item.name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs flex gap-2">
                    {item.type && <span>{item.type}</span>}
                    {item.type && item.rarity && <span>•</span>}
                    {item.rarity && (
                      <Badge variant={getRarityColor(item.rarity) as any} className="text-xs px-1.5 py-0">
                        {item.rarity}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {item.properties && (
                    <div className="text-xs">
                      <span className="font-semibold">Properties: </span>
                      <span className="text-muted-foreground">{item.properties}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    {item.value && (
                      <span className="font-semibold text-primary">{item.value}</span>
                    )}
                    {item.campaign && (
                      <span className="text-muted-foreground">{item.campaign.name}</span>
                    )}
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
