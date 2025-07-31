'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardContextMenuItem } from '@/components/card-context-menu'
import { Eye, EyeOff, Star, StarOff, DollarSign, Edit2, Loader2 } from 'lucide-react'
import { toggleDishStatus, toggleMostPurchased, updateDishPrice } from '@/app/actions/dish-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DishActionsProps {
  dishId: string
  dishName: string
  isActive: boolean
  isMostPurchased: boolean
  currentPrice: number
}

export function DishStatusToggle({ dishId, isActive }: { dishId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleDishStatus(dishId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle dish status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CardContextMenuItem onClick={handleToggle} className={loading ? "opacity-50 pointer-events-none" : ""}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isActive ? 'Deactivating...' : 'Activating...'}
        </>
      ) : isActive ? (
        <>
          <EyeOff className="h-4 w-4 mr-2 text-red-500" />
          <span>Deactivate</span>
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2 text-green-500" />
          <span>Activate</span>
        </>
      )}
    </CardContextMenuItem>
  )
}

export function MostPurchasedToggle({ dishId, isMostPurchased }: { dishId: string; isMostPurchased: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleMostPurchased(dishId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle most purchased:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CardContextMenuItem onClick={handleToggle} className={loading ? "opacity-50 pointer-events-none" : ""}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isMostPurchased ? 'Removing...' : 'Marking...'}
        </>
      ) : isMostPurchased ? (
        <>
          <StarOff className="h-4 w-4 mr-2 text-gray-500" />
          <span>Remove Popular</span>
        </>
      ) : (
        <>
          <Star className="h-4 w-4 mr-2 text-yellow-500" />
          <span>Mark Popular</span>
        </>
      )}
    </CardContextMenuItem>
  )
}

export function PriceEditor({ dishId, currentPrice }: { dishId: string; currentPrice: number }) {
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState(currentPrice.toString())
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    try {
      const numPrice = parseFloat(price)
      if (isNaN(numPrice) || numPrice < 0) {
        alert('Please enter a valid price')
        return
      }
      await updateDishPrice(dishId, numPrice)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to update price:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CardContextMenuItem onClick={(e) => e.preventDefault()}>
          <DollarSign className="h-4 w-4 mr-2 text-green-500" />
          <span>Edit Price</span>
        </CardContextMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg font-medium"
              />
            </div>
            <p className="text-xs text-gray-500">Enter the new price for this dish</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !price || parseFloat(price) < 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Price'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

