'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, Star, StarOff, DollarSign, Edit2, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { toggleDishStatus, toggleMostPurchased, updateDishPrice, deleteDish } from '@/app/actions/dish-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
    <DropdownMenuItem onClick={handleToggle} disabled={loading} className="focus:bg-gray-50">
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
    <DropdownMenuItem onClick={handleToggle} disabled={loading} className="focus:bg-gray-50">
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-gray-50">
          <DollarSign className="h-4 w-4 mr-2 text-green-500" />
          <span>Edit Price</span>
        </DropdownMenuItem>
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

export function DeleteDishAction({ dishId, dishName }: { dishId: string; dishName: string }) {
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteDish(dishId)
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete dish:', error)
      alert('Failed to delete dish. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem 
          onSelect={(e) => e.preventDefault()} 
          className="focus:bg-red-50 text-red-600"
          disabled={loading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          <span>Delete Dish</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Delete Dish
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <AlertDialogDescription className="text-gray-600 leading-relaxed">
            Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&ldquo;{dishName}&rdquo;</span>?
          </AlertDialogDescription>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <strong>Warning:</strong> This action cannot be undone. All dish data, including images, descriptions, and customer interactions will be permanently removed.
              </div>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}