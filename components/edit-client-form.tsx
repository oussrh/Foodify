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
import { Mail, Building2, Save, Check, AlertCircle, Plus, X, Search } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Restaurant Assignment</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Assignments
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Manage Restaurant Assignments
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search restaurants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-blue-400"
                      />
                    </div>
                    
                    {/* Restaurant List */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {restaurants
                        .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((restaurant) => {
                          const isAssigned = selectedRestaurants.includes(restaurant.id)
                          const wasOriginallyAssigned = defaultValues.restaurantIds?.includes(restaurant.id) || false
                          const isChanged = isAssigned !== wasOriginallyAssigned
                          
                          return (
                            <div 
                              key={restaurant.id}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                isAssigned ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                              } ${isChanged ? 'ring-2 ring-amber-200' : ''}`}
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {isAssigned && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                      Assigned
                                    </Badge>
                                  )}
                                  {isChanged && (
                                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                      {isAssigned ? 'New Assignment' : 'Will be Removed'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isAssigned ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentValues = watch('restaurantIds') || []
                                      const newValues = currentValues.filter(id => id !== restaurant.id)
                                      // Update form value
                                      setValue('restaurantIds', newValues)
                                    }}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentValues = watch('restaurantIds') || []
                                      const newValues = [...currentValues, restaurant.id]
                                      // Update form value
                                      setValue('restaurantIds', newValues)
                                    }}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                    disabled={isSubmitting}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    
                    {restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="text-center py-8">
                        <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No restaurants found</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Current Assignments */}
            <div className="space-y-3">
              {selectedRestaurants.length === 0 ? (
                <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center">
                  <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No restaurants assigned</p>
                  <p className="text-xs text-gray-500">Click "Manage Assignments" to assign restaurants to this user</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Assigned Restaurants ({selectedRestaurants.length})
                  </Label>
                  
                  <div className="space-y-2">
                    {selectedRestaurants.map((id) => {
                      const restaurant = restaurants.find(r => r.id === id)
                      const wasOriginallyAssigned = defaultValues.restaurantIds?.includes(id) || false
                      const isNewAssignment = !wasOriginallyAssigned
                      
                      return restaurant ? (
                        <div key={id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                  Assigned
                                </Badge>
                                {isNewAssignment && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                    ✨ New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentValues = watch('restaurantIds') || []
                              const newValues = currentValues.filter(currentId => currentId !== id)
                              setValue('restaurantIds', newValues)
                            }}
                            className="text-red-600 hover:bg-red-50"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
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