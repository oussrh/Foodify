'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, Star, StarOff, DollarSign, Edit2 } from 'lucide-react'
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
    <DropdownMenuItem onClick={handleToggle} disabled={loading}>
      {isActive ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Deactivate
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Activate
        </>
      )}
    </DropdownMenuItem>
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
    <DropdownMenuItem onClick={handleToggle} disabled={loading}>
      {isMostPurchased ? (
        <>
          <StarOff className="h-4 w-4 mr-2" />
          Remove Popular
        </>
      ) : (
        <>
          <Star className="h-4 w-4 mr-2" />
          Mark Popular
        </>
      )}
    </DropdownMenuItem>
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DollarSign className="h-4 w-4 mr-2" />
          Edit Price
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Price'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}