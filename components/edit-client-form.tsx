// PathFile: components/edit-client-form.tsx
'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateClient } from '@/app/actions/client-actions'
import { clientPatch, type ClientPatch } from '@/lib/schemas/user'
import EditAccountFields from '@/components/client-form/edit-account-fields'
import EditAssignmentSection from '@/components/client-form/edit-assignment-section'
import EditClientSubmit from '@/components/client-form/edit-client-submit'
import {
  Mail,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { useState, useMemo } from 'react'

type Restaurant = { id: string; name: string }

const schema = clientPatch
export type EditClientValues = ClientPatch

// One empty list, so an unset field keeps the same identity across renders (the memos below depend on it).
const NO_RESTAURANTS: string[] = []

/**
 * The super admin's edit of a restaurant manager: the email and the set of assigned restaurants,
 * which a save replaces as a whole; the password is not changed here.
 */
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

  // Calculate assignment changes
  const assignmentChanges = useMemo(() => {
    const originalIds = defaultValues.restaurantIds || []
    const added = selectedRestaurants.filter((id) => !originalIds.includes(id))
    const removed = originalIds.filter((id) => !selectedRestaurants.includes(id))

    return { added, removed }
  }, [defaultValues.restaurantIds, selectedRestaurants])

  const hasEmailChanged = currentEmail !== defaultValues.email

  const assign = (restaurantId: string) => {
    const currentValues = getValues('restaurantIds') || []
    setValue('restaurantIds', [...currentValues, restaurantId], { shouldDirty: true })
  }
  const remove = (restaurantId: string) => {
    const currentValues = getValues('restaurantIds') || []
    setValue('restaurantIds', currentValues.filter(currentId => currentId !== restaurantId), { shouldDirty: true })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Edit Administrator</h2>
          <p className="text-muted-foreground">Manage user account and restaurant assignments</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-lg">Restaurant Administrator</span>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
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
            <EditAccountFields email={register('email')} error={errors.email} hasEmailChanged={hasEmailChanged} disabled={isSubmitting} />

            {/* Restaurant Assignment */}
            <EditAssignmentSection
              restaurants={restaurants}
              selected={selectedRestaurants}
              original={defaultValues.restaurantIds}
              changes={assignmentChanges}
              onAssign={assign}
              onRemove={remove}
              disabled={isSubmitting}
            />

            {/* Submit Section */}
            <EditClientSubmit isDirty={isDirty} isSubmitting={isSubmitting} changes={assignmentChanges} hasEmailChanged={hasEmailChanged} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
