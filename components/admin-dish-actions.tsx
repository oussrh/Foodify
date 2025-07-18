'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
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
import { Eye, EyeOff, Star, StarOff, DollarSign, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toggleDishStatus, toggleMostPurchased, deleteDish } from '@/app/actions/dish-actions'

interface AdminDishActionsProps {
  dishId: string
  dishName: string
}

export function AdminDishActions({ dishId, dishName }: AdminDishActionsProps) {
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  const handleStatusToggle = async () => {
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
    <>
      <DropdownMenuItem onClick={handleStatusToggle} disabled={loading} className="focus:bg-gray-50">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2 text-blue-500" />
            <span>Toggle Visibility</span>
          </>
        )}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handlePopularToggle} disabled={loading} className="focus:bg-gray-50">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            <span>Toggle Popular</span>
          </>
        )}
      </DropdownMenuItem>

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
          
          <AlertDialogDescription className="text-gray-600 leading-relaxed">
            Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&ldquo;{dishName}&rdquo;</span>?
            <br /><br />
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. All dish data, including images, descriptions, and customer interactions will be permanently removed.
                </div>
              </div>
            </div>
          </AlertDialogDescription>
          
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
    </>
  )
}