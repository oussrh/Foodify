// PathFile: components/edit-client-form.tsx
'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateClient } from '@/app/actions/client-actions'
import { clientPatch, type ClientPatch } from '@/lib/schemas/user'
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
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Loader2,
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

const schema = clientPatch
export type EditClientValues = ClientPatch

// One empty list, so an unset field keeps the same identity across renders (the memos below depend on it).
const NO_RESTAURANTS: string[] = []

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
    control,
    getValues,
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

  const currentEmail = useWatch({ control, name: 'email' })
  const selectedRestaurants = useWatch({ control, name: 'restaurantIds' }) ?? NO_RESTAURANTS

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
    const added = selectedRestaurants.filter((id) => !originalIds.includes(id))
    const removed = originalIds.filter((id) => !selectedRestaurants.includes(id))
    
    return { added, removed }
  }, [defaultValues.restaurantIds, selectedRestaurants])

  const hasEmailChanged = currentEmail !== defaultValues.email

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Edit Administrator</h2>
          <p className="text-muted-foreground">Manage user account and restaurant assignments</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-card/20 rounded-lg">
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
            <div className="mb-6 p-4 border border-border rounded-md flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success dark:text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-success">User updated successfully!</p>
                <p className="text-xs text-success dark:text-muted-foreground mt-1">All changes have been saved and applied.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 border border-border rounded-md flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive dark:text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs text-destructive dark:text-muted-foreground mt-1">Please try again or contact support if the problem persists.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Account Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="p-2 bg-muted rounded-lg">
                  <Shield className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                  <p className="text-sm text-muted-foreground">Basic account credentials and login details</p>
                </div>
              </div>
              
              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    {...register('email')} 
                    className="h-12"
                    placeholder="admin@restaurant.com"
                    disabled={isSubmitting}
                  />
                  {hasEmailChanged && (
                    <div className="absolute right-3 top-1/2 transform -/2">
                      <Badge className="bg-muted text-warning dark:text-muted-foreground border-border text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Changed
                      </Badge>
                    </div>
                  )}
                </div>
                
                {errors.email && (
                  <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive dark:text-muted-foreground">{errors.email.message}</p>
                  </div>
                )}
                
                {hasEmailChanged && (
                  <div className="p-4 border border-border rounded-md">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning dark:text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">Email Address Change</p>
                        <p className="text-sm text-warning dark:text-muted-foreground mt-1">
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
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Restaurant Assignment</h3>
                    <p className="text-sm text-muted-foreground">Manage which restaurants this user can access</p>
                  </div>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-2 border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted hover:border-border dark: transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Assignments
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-background border-border">
                    <DialogHeader className="shrink-0">
                      <DialogTitle className="flex items-center gap-3 text-xl text-foreground">
                        <div className="p-2 bg-muted rounded-lg">
                          <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                        </div>
                        <div>
                          <span>Manage Restaurant Assignments</span>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            Select which restaurants this administrator can manage
                          </p>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                      {/* Controls */}
                      <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search restaurants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12"
                          />
                        </div>
                        
                        {/* Filter Toggle */}
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={showAssignedOnly ? "default" : "outline"}
                            onClick={() => setShowAssignedOnly(!showAssignedOnly)}
                            className={showAssignedOnly 
                              ? "bg-primary hover:bg-primary text-white" 
                              : "btn-outline"
                            }
                          >
                            <Filter className="h-4 w-4 mr-2" />
                            {showAssignedOnly ? "Show All" : "Assigned Only"}
                          </Button>
                          
                          <Badge className="badge-secondary">
                            {filteredRestaurants.length} restaurants
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Assignment Summary */}
                      {(assignmentChanges.added.length > 0 || assignmentChanges.removed.length > 0) && (
                        <div className="shrink-0 p-4 border border-border rounded-md">
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-muted-foreground dark:text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Pending Changes</p>
                              <div className="flex flex-wrap gap-2">
                                {assignmentChanges.added.length > 0 && (
                                  <Badge className="bg-muted text-success dark:text-muted-foreground border-border text-xs">
                                    +{assignmentChanges.added.length} Added
                                  </Badge>
                                )}
                                {assignmentChanges.removed.length > 0 && (
                                  <Badge className="bg-muted text-destructive dark:text-muted-foreground border-border text-xs">
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
                              className={`flex items-center justify-between p-4 border-2 rounded-md transition-colors ${
 isAssigned 
 ? ' border-border' 
 : 'bg-card border-border hover:bg-accent hover:border-accent-foreground/20'
 } ${isChanged ? 'ring-2 ring-offset-2 dark:ring-offset-background' : ''}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
 isAssigned ? 'bg-muted' : 'bg-muted'
 }`}>
                                    <Building2 className={`h-4 w-4 ${
 isAssigned ? 'text-muted-foreground dark:text-muted-foreground' : 'text-muted-foreground'
 }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isAssigned && (
                                        <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border text-xs">
                                          <Check className="h-3 w-3 mr-1" />
                                          Assigned
                                        </Badge>
                                      )}
                                      {isChanged && (
                                        <Badge className="bg-muted text-warning dark:text-muted-foreground border-border text-xs">
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
                                      const currentValues = getValues('restaurantIds') || []
                                      const newValues = currentValues.filter(currentId => currentId !== restaurant.id)
                                      setValue('restaurantIds', newValues, { shouldDirty: true })
                                    }}
                                    className="border-border text-destructive dark:text-muted-foreground hover:bg-muted hover:border-border dark:"
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
                                      const currentValues = getValues('restaurantIds') || []
                                      const newValues = [...currentValues, restaurant.id]
                                      setValue('restaurantIds', newValues, { shouldDirty: true })
                                    }}
                                    className="border-border text-success dark:text-muted-foreground hover:bg-muted hover:border-border dark:"
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
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No restaurants found</h3>
                            <p className="text-sm text-muted-foreground">
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
                  <div className="p-8 border-2 border-dashed border-border rounded-md text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No restaurants assigned</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This administrator doesn&apos;t have access to any restaurants yet
                    </p>
                    <Button
                      type="button"
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-primary hover:bg-primary text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Restaurants
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Assigned Restaurants ({selectedRestaurants.length})
                      </Label>
                      <Badge className="badge-secondary">
                        {selectedRestaurants.length} {selectedRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {selectedRestaurants.map((restaurantId) => {
                        const restaurant = restaurants.find(r => r.id === restaurantId)
                        const wasOriginallyAssigned = defaultValues.restaurantIds?.includes(restaurantId) || false
                        const isNewAssignment = !wasOriginallyAssigned
                        
                        return restaurant ? (
                          <div key={restaurantId} className="flex items-center justify-between p-4 border border-border rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <Building2 className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    Assigned
                                  </Badge>
                                  {isNewAssignment && (
                                    <Badge className="bg-muted text-success dark:text-muted-foreground border-border text-xs">
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
                                const currentValues = getValues('restaurantIds') || []
                                const newValues = currentValues.filter(currentId => currentId !== restaurantId)
                                setValue('restaurantIds', newValues, { shouldDirty: true })
                              }}
                              className="text-destructive dark:text-muted-foreground hover:bg-muted hover:text-destructive dark:hover:text-muted-foreground"
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
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDirty && (
                    <div className="flex items-center gap-2 text-warning dark:text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">You have unsaved changes</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isDirty}
                  className="h-12 px-8 disabled:opacity-50 text-white font-semibold rounded-md transition-colors transform hover:scale-[1.02] disabled:"
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
                <div className="p-4 bg-muted border border-border rounded-md">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary of Changes</h4>
                  <div className="space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
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
