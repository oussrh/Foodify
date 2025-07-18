'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateClient } from '@/app/actions/client-actions'
import { Mail, Building2, Save, Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'

type Restaurant = { id: string; name: string }

const schema = z.object({
  email: z.string().email(),
  restaurantIds: z.array(z.string()).optional(),
})

export type EditClientValues = z.infer<typeof schema>

export default function EditClientForm({
  id,
  defaultValues,
  restaurants,
}: {
  id: string
  defaultValues: EditClientValues
  restaurants: Restaurant[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<EditClientValues>({ 
    resolver: zodResolver(schema), 
    defaultValues 
  })

  const onSubmit = async (data: EditClientValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateClient(id, data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to update user. Please try again.')
      console.error('Error updating client:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedRestaurants = watch('restaurantIds') || []
  const currentEmail = watch('email')

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Edit Restaurant Administrator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">User updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h3>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                id="email" 
                {...register('email')} 
                className="border-blue-200 focus:border-blue-400"
                placeholder="admin@restaurant.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
              
              {currentEmail !== defaultValues.email && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <strong>Email Change:</strong> The user will need to log in with the new email address.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Restaurant Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Restaurant Assignment</h3>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Assign to Restaurants
              </Label>
              
              {restaurants.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No restaurants available</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                  {restaurants.map((r: Restaurant) => {
                    const isSelected = selectedRestaurants.includes(r.id)
                    const wasOriginallySelected = defaultValues.restaurantIds?.includes(r.id) || false
                    const isChanged = isSelected !== wasOriginallySelected
                    
                    return (
                      <div 
                        key={r.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        } ${isChanged ? 'ring-2 ring-amber-200' : ''}`}
                      >
                        <Checkbox
                          id={`restaurant-${r.id}`}
                          value={r.id}
                          {...register('restaurantIds')}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`restaurant-${r.id}`} className="font-normal flex-1 cursor-pointer">
                          {r.name}
                        </Label>
                        {isChanged && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Changed
                          </Badge>
                        )}
                        {isSelected && !isChanged && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {selectedRestaurants.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    Currently Assigned Restaurants ({selectedRestaurants.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedRestaurants.map((id) => {
                      const restaurant = restaurants.find(r => r.id === id)
                      const wasOriginallySelected = defaultValues.restaurantIds?.includes(id) || false
                      const isNewAssignment = !wasOriginallySelected
                      
                      return restaurant ? (
                        <Badge 
                          key={id} 
                          className={`${
                            isNewAssignment 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {restaurant.name}
                          {isNewAssignment && <span className="ml-1">✨</span>}
                        </Badge>
                      ) : null
                    })}
                  </div>
                  
                  {selectedRestaurants.some(id => !(defaultValues.restaurantIds?.includes(id) || false)) && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                      ✨ indicates new assignment
                    </p>
                  )}
                </div>
              )}

              {/* Show removed restaurants */}
              {defaultValues.restaurantIds && defaultValues.restaurantIds.length > 0 && (
                (() => {
                  const removedRestaurants = defaultValues.restaurantIds.filter(id => !selectedRestaurants.includes(id))
                  if (removedRestaurants.length > 0) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          Restaurants to be removed ({removedRestaurants.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {removedRestaurants.map((id) => {
                            const restaurant = restaurants.find(r => r.id === id)
                            return restaurant ? (
                              <Badge key={id} className="bg-red-100 text-red-700 border-red-200">
                                {restaurant.name} ❌
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )
                  }
                  return null
                })()
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isDirty}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating User...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </div>
              )}
            </Button>
            
            {isDirty && (
              <div className="flex items-center text-sm text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Unsaved changes
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}