'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
} from 'lucide-react'
import { toggleDishStatus, toggleMostPurchased } from '@/app/actions/dish-actions'

interface DishStatusManagerProps {
  dishId: string
  isActive: boolean
  isMostPurchased: boolean
}

/**
 * The dish editor's two switches, live on the menu and the Popular tag; each flips its flag on the
 * server at once and refreshes the route.
 */
export default function DishStatusManager({ 
  dishId, 
  isActive, 
  isMostPurchased, 
}: DishStatusManagerProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusToggle = async () => {
    setLoading(true)
    try {
      await toggleDishStatus(dishId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePopularToggle = async () => {
    setLoading(true)
    try {
      await toggleMostPurchased(dishId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle popular status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-card px-4 py-3">
      <label className="flex items-center gap-3 text-sm">
        <Switch checked={isActive} onCheckedChange={handleStatusToggle} disabled={loading} aria-label="Live on the menu" />
        <span>
          <span className="block font-medium">{isActive ? 'Live on the menu' : 'Hidden from the menu'}</span>
          <span className="block text-xs text-muted-foreground">Diners only see live dishes.</span>
        </span>
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Switch checked={isMostPurchased} onCheckedChange={handlePopularToggle} disabled={loading} aria-label="Popular" />
        <span>
          <span className="block font-medium">Popular</span>
          <span className="block text-xs text-muted-foreground">Shows a “Popular” tag on the menu.</span>
        </span>
      </label>
      {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  )
}
