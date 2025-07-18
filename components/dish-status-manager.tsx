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
  Sparkles,
  Loader2,
  Zap
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
    <div className="space-y-8">
      {/* Status Controls */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          <h4 className="font-semibold text-gray-900">Visibility & Status</h4>
        </div>
        
        <div className={`flex items-center justify-between p-6 border-2 rounded-xl transition-all duration-300 ${isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isActive ? (
                <Eye className="h-6 w-6 text-green-600" />
              ) : (
                <EyeOff className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Dish Visibility</div>
              <div className="text-sm text-gray-600">
                {isActive ? 'Visible to customers on the menu' : 'Hidden from public menu'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={isActive ? 'default' : 'secondary'} 
              className={isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={handleStatusToggle}
              disabled={loading}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>

        <div className={`flex items-center justify-between p-6 border-2 rounded-xl transition-all duration-300 ${isMostPurchased ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isMostPurchased ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              {isMostPurchased ? (
                <Star className="h-6 w-6 text-yellow-600 fill-current" />
              ) : (
                <StarOff className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Popular Item</div>
              <div className="text-sm text-gray-600">
                {isMostPurchased ? 'Highlighted as customer favorite' : 'Regular menu item'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={isMostPurchased ? 'default' : 'outline'} 
              className={isMostPurchased ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : ''}
            >
              {isMostPurchased ? 'Popular' : 'Regular'}
            </Badge>
            <Switch
              checked={isMostPurchased}
              onCheckedChange={handlePopularToggle}
              disabled={loading}
              className="data-[state=checked]:bg-yellow-600"
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h4 className="font-semibold text-gray-900">Additional Information</h4>
        </div>
        
        <div className="p-6 border-2 border-blue-100 bg-blue-50/50 rounded-xl space-y-4">
          <div className="space-y-3">
            <Label htmlFor="calories" className="text-sm font-medium text-gray-900">Calories (optional)</Label>
            <div className="flex gap-3">
              <Input
                id="calories"
                type="number"
                min="0"
                value={localCalories}
                onChange={(e) => setLocalCalories(e.target.value)}
                placeholder="e.g., 350"
                className="flex-1 border-blue-200 focus:border-blue-400"
              />
              <Button 
                onClick={handleCaloriesUpdate}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 min-w-[80px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-blue-600 bg-blue-100/50 p-2 rounded">
              💡 Help health-conscious customers make informed choices
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Current Status Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-600">Visibility</span>
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium text-sm">Visible</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium text-sm">Hidden</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-600">Popular</span>
            <div className="flex items-center gap-2">
              {isMostPurchased ? (
                <>
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-yellow-600 font-medium text-sm">Yes</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500 font-medium text-sm">No</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-600">Calories</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-sm text-gray-900">
                {calories ? `${calories} cal` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}