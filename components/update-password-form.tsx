// PathFile: components/update-password-form.tsx
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
  X,
  KeyRound,
  AlertTriangle,
  Zap,
  Info,
  ArrowRight,
  CheckCircle2,
  RefreshCw
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
  const confirmPassword = watch('confirm') || ''

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
    strengthScore === 5 ? 'text-green-600 bg-green-100 border-green-200' :
    strengthScore >= 3 ? 'text-yellow-600 bg-yellow-100 border-yellow-200' :
    strengthScore >= 1 ? 'text-orange-600 bg-orange-100 border-orange-200' : 'text-red-600 bg-red-100 border-red-200'

  const strengthIcon = 
    strengthScore === 5 ? <Shield className="h-3 w-3" /> :
    strengthScore >= 3 ? <Zap className="h-3 w-3" /> :
    strengthScore >= 1 ? <AlertTriangle className="h-3 w-3" /> : <X className="h-3 w-3" />

  const passwordsMatch = password && confirmPassword && password === confirmPassword

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Update Password</h2>
          <p className="text-gray-600">Keep your account secure with a strong password</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Password updated successfully!</p>
            <p className="text-xs text-green-600 mt-1">Your account is now more secure and protected</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-1">Please verify your information and try again</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-3">
          <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-500" />
            Current Password
          </Label>
          <div className="relative group">
            <Input 
              id="currentPassword" 
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
              className="pl-4 pr-12 h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 group-hover:border-gray-300"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.currentPassword.message}</p>
            </div>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-3">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            New Password
          </Label>
          <div className="relative group">
            <Input 
              id="password" 
              type={showNewPassword ? 'text' : 'password'}
              {...register('password')}
              className="pl-4 pr-12 h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 group-hover:border-gray-300"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.password.message}</p>
            </div>
          )}

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Password strength</span>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${strengthColor}`}>
                  {strengthIcon}
                  {strengthLevel}
                </div>
              </div>
              
              {/* Strength Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      strengthScore === 5 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      strengthScore >= 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      strengthScore >= 1 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Requirements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg transition-colors">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                        check.test ? 'bg-green-100 scale-110' : 'bg-gray-100'
                      }`}>
                        {check.test ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <span className={`text-sm transition-colors duration-200 ${check.test ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
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
        <div className="space-y-3">
          <Label htmlFor="confirm" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            Confirm New Password
          </Label>
          <div className="relative group">
            <Input 
              id="confirm" 
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirm')}
              className={`pl-4 pr-12 h-12 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 group-hover:border-gray-300 ${
                confirmPassword && passwordsMatch 
                  ? 'border-green-300 focus:border-green-400' 
                  : confirmPassword && !passwordsMatch 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-gray-200 focus:border-blue-400'
              }`}
              placeholder="Confirm your new password"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {confirmPassword && passwordsMatch && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {errors.confirm && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.confirm.message}</p>
            </div>
          )}
          {confirmPassword && passwordsMatch && !errors.confirm && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Passwords match perfectly!</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 space-y-4">
          <Button 
            type="submit" 
            disabled={loading || strengthScore < 5}
            className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating Password...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                <span>Update Password</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
          
          {strengthScore < 5 && password && (
            <div className="flex items-center gap-2 justify-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">
                Please meet all password requirements to continue
              </p>
            </div>
          )}

          {strengthScore === 5 && !passwordsMatch && confirmPassword && (
            <div className="flex items-center gap-2 justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">
                Please ensure both passwords match
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Security Tips */}
      <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Security Best Practices</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use a unique password that you don&apos;t use anywhere else</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Consider using a password manager to generate and store strong passwords</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Never share your password with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Change your password if you suspect it has been compromised</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
