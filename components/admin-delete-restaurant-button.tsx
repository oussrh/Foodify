'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface AdminDeleteRestaurantButtonProps {
  restaurantId: string
  restaurantName: string
}

export function AdminDeleteRestaurantButton({ restaurantId, restaurantName }: AdminDeleteRestaurantButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete restaurant')
      }
      
      router.push('/admin/restaurants')
    } catch (error) {
      console.error('Failed to delete restaurant:', error)
      alert('Failed to delete restaurant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full bg-red-600 hover:bg-red-700"
          size="sm"
          disabled={loading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Restaurant Permanently
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Delete Restaurant
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-gray-600 leading-relaxed">
          Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&ldquo;{restaurantName}&rdquo;</span>?
          <br /><br />
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <strong>Warning:</strong> This action cannot be undone. All restaurant data including menus, dishes, users, categories, and customer data will be permanently removed.
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
  )
}