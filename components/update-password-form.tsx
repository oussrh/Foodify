'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updatePassword } from '@/app/actions/profile-actions'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Check,
  X
} from 'lucide-react'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

export default function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const password = watch('password') || ''

  // Password strength validation
  const passwordChecks = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'One uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', test: /[a-z]/.test(password) },
    { label: 'One number', test: /[0-9]/.test(password) },
    { label: 'One special character', test: /[^A-Za-z0-9]/.test(password) },
  ]

  const strengthScore = passwordChecks.filter(check => check.test).length
  const strengthLevel = 
    strengthScore === 5 ? 'Strong' :
    strengthScore >= 3 ? 'Medium' :
    strengthScore >= 1 ? 'Weak' : 'Very Weak'

  const strengthColor = 
    strengthScore === 5 ? 'text-green-600 bg-green-100' :
    strengthScore >= 3 ? 'text-yellow-600 bg-yellow-100' :
    strengthScore >= 1 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100'

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      await updatePassword(data.password)
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Failed to update password. Please check your current password and try again.')
      console.error('Password update error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Password updated successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Current Password
          </Label>
          <div className="relative">
            <Input 
              id="currentPassword" 
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
              className="pr-10 border-gray-200 focus:border-blue-400"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            New Password
          </Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showNewPassword ? 'text' : 'password'}
              {...register('password')}
              className="pr-10 border-gray-200 focus:border-blue-400"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.password.message}
            </p>
          )}

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${strengthColor}`}>
                  {strengthLevel}
                </span>
              </div>
              
              {/* Strength Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strengthScore === 5 ? 'bg-green-500' :
                    strengthScore >= 3 ? 'bg-yellow-500' :
                    strengthScore >= 1 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                ></div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-1">
                <p className="text-xs text-gray-600 font-medium">Password requirements:</p>
                <div className="grid grid-cols-1 gap-1">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {check.test ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={`text-xs ${check.test ? 'text-green-600' : 'text-gray-500'}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Confirm New Password
          </Label>
          <div className="relative">
            <Input 
              id="confirm" 
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirm')}
              className="pr-10 border-gray-200 focus:border-blue-400"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.confirm.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            type="submit" 
            disabled={loading || strengthScore < 5}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Update Password
              </div>
            )}
          </Button>
          
          {strengthScore < 5 && password && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please meet all password requirements to continue
            </p>
          )}
        </div>
      </form>

      {/* Security Tips */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Security Tips</p>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Use a unique password that you don't use anywhere else</li>
              <li>• Consider using a password manager to generate and store strong passwords</li>
              <li>• Never share your password with anyone</li>
              <li>• Change your password if you suspect it has been compromised</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
