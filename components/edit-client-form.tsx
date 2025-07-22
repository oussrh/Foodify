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
import { 
  Mail, 
  Building2, 
  Save, 
  Check, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Users,
  Settings,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Restaurant = { id: string; name: string }

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
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
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)

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
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Failed to update user. Please check your connection and try again.')
      console.error('Error updating client:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedRestaurants = watch('restaurantIds') || []
  const currentEmail = watch('email')

  // Filter restaurants based on search and toggle
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
      const isAssigned = selectedRestaurants.includes(restaurant.id)
      
      if (showAssignedOnly) {
        return matchesSearch && isAssigned
      }
      return matchesSearch
    })
  }, [restaurants, searchTerm, selectedRestaurants, showAssignedOnly])

  // Calculate assignment changes
  const assignmentChanges = useMemo(() => {
    const originalIds = defaultValues.restaurantIds || []
    const currentIds = selectedRestaurants
    
    const added = currentIds.filter(id => !originalIds.includes(id))
    const removed = originalIds.filter(id => !currentIds.includes(id))
    
    return { added, removed }
  }, [defaultValues.restaurantIds, selectedRestaurants])

  const hasEmailChanged = currentEmail !== defaultValues.email

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Administrator</h2>
          <p className="text-gray-600">Manage user account and restaurant assignments</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg">Restaurant Administrator</span>
              <p className="text-blue-100 text-sm font-normal mt-1">
                Update account details and manage restaurant access
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">User updated successfully!</p>
                <p className="text-xs text-green-600 mt-1">All changes have been saved and applied.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600 mt-1">Please try again or contact support if the problem persists.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Account Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                  <p className="text-sm text-gray-600">Basic account credentials and login details</p>
                </div>
              </div>
              
              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    {...register('email')} 
                    className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200"
                    placeholder="admin@restaurant.com"
                    disabled={isSubmitting}
                  />
                  {hasEmailChanged && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Changed
                      </Badge>
                    </div>
                  )}
                </div>
                
                {errors.email && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errors.email.message}</p>
                  </div>
                )}
                
                {hasEmailChanged && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Email Address Change</p>
                        <p className="text-sm text-amber-700 mt-1">
                          The user will need to log in with the new email address. They should update their saved login credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Assignment */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Restaurant Assignment</h3>
                    <p className="text-sm text-gray-600">Manage which restaurants this user can access</p>
                  </div>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Assignments
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <span>Manage Restaurant Assignments</span>
                          <p className="text-sm text-gray-600 font-normal mt-1">
                            Select which restaurants this administrator can manage
                          </p>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                      {/* Controls */}
                      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search restaurants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl"
                          />
                        </div>
                        
                        {/* Filter Toggle */}
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={showAssignedOnly ? "default" : "outline"}
                            onClick={() => setShowAssignedOnly(!showAssignedOnly)}
                            className={showAssignedOnly 
                              ? "bg-purple-600 hover:bg-purple-700" 
                              : "border-gray-200 hover:bg-gray-50"
                            }
                          >
                            <Filter className="h-4 w-4 mr-2" />
                            {showAssignedOnly ? "Show All" : "Assigned Only"}
                          </Button>
                          
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                            {filteredRestaurants.length} restaurants
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Assignment Summary */}
                      {(assignmentChanges.added.length > 0 || assignmentChanges.removed.length > 0) && (
                        <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900 mb-2">Pending Changes</p>
                              <div className="flex flex-wrap gap-2">
                                {assignmentChanges.added.length > 0 && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                    +{assignmentChanges.added.length} Added
                                  </Badge>
                                )}
                                {assignmentChanges.removed.length > 0 && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                    -{assignmentChanges.removed.length} Removed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Restaurant List */}
                      <div className="flex-1 overflow-y-auto space-y-3">
                        {filteredRestaurants.map((restaurant) => {
                          const isAssigned = selectedRestaurants.includes(restaurant.id)
                          const wasOriginallyAssigned = defaultValues.restaurantIds?.includes(restaurant.id) || false
                          const isChanged = isAssigned !== wasOriginallyAssigned
                          
                          return (
                            <div 
                              key={restaurant.id}
                              className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 ${
                                isAssigned 
                                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              } ${isChanged ? 'ring-2 ring-amber-200 ring-offset-2' : ''}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    isAssigned ? 'bg-purple-100' : 'bg-gray-100'
                                  }`}>
                                    <Building2 className={`h-4 w-4 ${
                                      isAssigned ? 'text-purple-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isAssigned && (
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                          <Check className="h-3 w-3 mr-1" />
                                          Assigned
                                        </Badge>
                                      )}
                                      {isChanged && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                          {isAssigned ? '✨ New Assignment' : '🗑️ Will be Removed'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
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
                                      const newValues = currentValues.filter(currentId => currentId !== restaurant.id)
                                      setValue('restaurantIds', newValues, { shouldDirty: true })
                                    }}
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
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
                                      setValue('restaurantIds', newValues, { shouldDirty: true })
                                    }}
                                    className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
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
                      
                      {filteredRestaurants.length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-12">
                          <div className="text-center">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
                            <p className="text-sm text-gray-600">
                              {searchTerm 
                                ? "Try adjusting your search terms" 
                                : "No restaurants available for assignment"
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Current Assignments */}
              <div className="space-y-4">
                {selectedRestaurants.length === 0 ? (
                  <div className="p-8 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants assigned</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This administrator doesn&apos;t have access to any restaurants yet
                    </p>
                    <Button
                      type="button"
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Restaurants
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Assigned Restaurants ({selectedRestaurants.length})
                      </Label>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {selectedRestaurants.length} {selectedRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {selectedRestaurants.map((restaurantId) => {
                        const restaurant = restaurants.find(r => r.id === restaurantId)
                        const wasOriginallyAssigned = defaultValues.restaurantIds?.includes(restaurantId) || false
                        const isNewAssignment = !wasOriginallyAssigned
                        
                        return restaurant ? (
                          <div key={restaurantId} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Building2 className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    Assigned
                                  </Badge>
                                  {isNewAssignment && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      New
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
                                const newValues = currentValues.filter(currentId => currentId !== restaurantId)
                                setValue('restaurantIds', newValues, { shouldDirty: true })
                              }}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
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

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDirty && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">You have unsaved changes</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isDirty}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-700 hover:via-cyan-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Updating User...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
              
              {/* Change Summary */}
              {isDirty && (assignmentChanges.added.length > 0 || assignmentChanges.removed.length > 0 || hasEmailChanged) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Summary of Changes</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    {hasEmailChanged && (
                      <p>• Email address will be updated</p>
                    )}
                    {assignmentChanges.added.length > 0 && (
                      <p>• {assignmentChanges.added.length} restaurant(s) will be added</p>
                    )}
                    {assignmentChanges.removed.length > 0 && (
                      <p>• {assignmentChanges.removed.length} restaurant(s) will be removed</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
