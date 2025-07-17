'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Star, 
  StarOff, 
  Save,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { toggleDishStatus, toggleMostPurchased, updateDish } from '@/app/actions/dish-actions'

interface DishStatusManagerProps {
  dishId: string
  isActive: boolean
  isMostPurchased: boolean
  calories?: number | null
}

export default function DishStatusManager({ 
  dishId, 
  isActive, 
  isMostPurchased, 
  calories 
}: DishStatusManagerProps) {
  const [loading, setLoading] = useState(false)
  const [localCalories, setLocalCalories] = useState(calories?.toString() || '')
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

  const handleCaloriesUpdate = async () => {
    setLoading(true)
    try {
      const caloriesValue = localCalories.trim() ? parseInt(localCalories) : null
      await updateDish(dishId, '', { calories: caloriesValue })
      router.refresh()
    } catch (error) {
      console.error('Failed to update calories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Controls */}
      <div className="space-y-4">
        <h4 className="font-semibold">Visibility & Status</h4>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isActive ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <div className="font-medium">Dish Visibility</div>
              <div className="text-sm text-muted-foreground">
                {isActive ? 'Visible to customers' : 'Hidden from menu'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={handleStatusToggle}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isMostPurchased ? (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <div className="font-medium">Popular Item</div>
              <div className="text-sm text-muted-foreground">
                {isMostPurchased ? 'Marked as customer favorite' : 'Regular menu item'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMostPurchased ? 'default' : 'outline'}>
              {isMostPurchased ? 'Popular' : 'Regular'}
            </Badge>
            <Switch
              checked={isMostPurchased}
              onCheckedChange={handlePopularToggle}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <h4 className="font-semibold">Additional Information</h4>
        
        <div className="space-y-2">
          <Label htmlFor="calories">Calories (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="calories"
              type="number"
              min="0"
              value={localCalories}
              onChange={(e) => setLocalCalories(e.target.value)}
              placeholder="e.g., 350"
              className="flex-1"
            />
            <Button 
              onClick={handleCaloriesUpdate}
              disabled={loading}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Help health-conscious customers make informed choices
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Current Status
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Visibility:</span>
            <span className={isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {isActive ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Popular:</span>
            <span className={isMostPurchased ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
              {isMostPurchased ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Calories:</span>
            <span className="font-medium">
              {calories ? `${calories} cal` : 'Not set'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}