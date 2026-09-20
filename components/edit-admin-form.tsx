'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateAdmin } from '@/app/actions/admin-user-actions'
import { adminPatch, type AdminPatch } from '@/lib/schemas/user'
import { Mail, Save, Check, AlertCircle, Shield, Edit } from 'lucide-react'
import { useState } from 'react'

const schema = adminPatch
export type EditAdminValues = AdminPatch

export default function EditAdminForm({
  id,
  defaultValues,
}: {
  id: string
  defaultValues: EditAdminValues
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
  } = useForm<EditAdminValues>({ resolver: zodResolver(schema), defaultValues })

  const onSubmit = async (data: EditAdminValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateAdmin(id, data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to update administrator. Please try again.')
      console.error('Error updating admin:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const currentEmail = useWatch({ control, name: 'email' })

  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-destructive" />
          Edit Administrator Account
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {success && (
          <div className="mb-6 p-4 bg-muted border border-border rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">Administrator updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-muted border border-border rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Account Information</h3>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                id="email" 
                {...register('email')} 
                className="border-border focus:border-border-strong"
                placeholder="admin@foodify.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
              
              {currentEmail !== defaultValues.email && (
                <div className="p-3 bg-muted border border-border rounded-lg">
                  <p className="text-sm text-warning">
                    <strong>Email Change:</strong> The administrator will need to log in with the new email address.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Administrator Privileges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Administrator Privileges</h3>
            
            <div className="p-4 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Super Administrator Access</span>
              </div>
              <div className="space-y-2 text-sm text-destructive">
                <p>• Full access to all restaurants and menus</p>
                <p>• Ability to create and manage admin accounts</p>
                <p>• Access to all user data and system settings</p>
                <p>• Complete administrative control over the platform</p>
              </div>
            </div>
            
            <div className="p-3 bg-muted border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Super administrators have unrestricted access to all system functions and data.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isDirty}
              className="flex-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating Administrator...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </div>
              )}
            </Button>
            
            {isDirty && (
              <div className="flex items-center text-sm text-warning">
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
