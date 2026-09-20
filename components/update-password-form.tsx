// PathFile: components/update-password-form.tsx
'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
    control,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const password = useWatch({ control, name: 'password' }) || ''
  const confirmPassword = useWatch({ control, name: 'confirm' }) || ''

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
    strengthScore === 5 ? 'text-success bg-muted border-border' :
    strengthScore >= 3 ? 'text-warning bg-muted border-border' :
    strengthScore >= 1 ? 'text-warning bg-muted border-border' : 'text-destructive bg-muted border-border'

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
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Update Password</h2>
          <p className="text-muted-foreground">Keep your account secure with a strong password</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Password updated successfully!</p>
            <p className="text-xs text-success mt-1">Your account is now more secure and protected</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-destructive mt-1">Please verify your information and try again</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-3">
          <Label htmlFor="currentPassword" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Current Password
          </Label>
          <div className="relative group">
            <Input 
              id="currentPassword" 
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
              className="pl-4 pr-12 h-12 border-2 border-border focus:border-border-strong focus:ring-4 rounded-md transition-colors group-hover:border-border"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 transform -/2 text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            </div>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-3">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            New Password
          </Label>
          <div className="relative group">
            <Input 
              id="password" 
              type={showNewPassword ? 'text' : 'password'}
              {...register('password')}
              className="pl-4 pr-12 h-12 border-2 border-border focus:border-border-strong focus:ring-4 rounded-md transition-colors group-hover:border-border"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 transform -/2 text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{errors.password.message}</p>
            </div>
          )}

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-4 p-4 rounded-md border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Password strength</span>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${strengthColor}`}>
                  {strengthIcon}
                  {strengthLevel}
                </div>
              </div>
              
              {/* Strength Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-colors ${
 strengthScore === 5 ? '' :
 strengthScore >= 3 ? '' :
 strengthScore >= 1 ? '' : 'bg-muted0'
 }`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Requirements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg transition-colors">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
 check.test ? 'bg-muted' : 'bg-muted'
 }`}>
                        {check.test ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm transition-colors duration-200 ${check.test ? 'text-success font-medium' : 'text-muted-foreground'}`}>
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
          <Label htmlFor="confirm" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Confirm New Password
          </Label>
          <div className="relative group">
            <Input 
              id="confirm" 
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirm')}
              className={`pl-4 pr-12 h-12 border-2 focus:ring-4 rounded-md transition-colors group-hover:border-border ${
 confirmPassword && passwordsMatch 
 ? 'border-border focus:border-border-strong' 
 : confirmPassword && !passwordsMatch 
 ? 'border-border focus:border-border-strong' 
 : 'border-border focus:border-border-strong'
 }`}
              placeholder="Confirm your new password"
            />
            <div className="absolute right-4 top-1/2 transform -/2 flex items-center gap-1">
              {confirmPassword && passwordsMatch && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {errors.confirm && (
            <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{errors.confirm.message}</p>
            </div>
          )}
          {confirmPassword && passwordsMatch && !errors.confirm && (
            <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <p className="text-sm text-success font-medium">Passwords match perfectly!</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 space-y-4">
          <Button 
            type="submit" 
            disabled={loading || strengthScore < 5}
            className="w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors transform hover:scale-[1.02] disabled:"
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
            <div className="flex items-center gap-2 justify-center p-3 bg-muted border border-border rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm text-warning font-medium">
                Please meet all password requirements to continue
              </p>
            </div>
          )}

          {strengthScore === 5 && !passwordsMatch && confirmPassword && (
            <div className="flex items-center gap-2 justify-center p-3 bg-muted border border-border rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">
                Please ensure both passwords match
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Security Tips */}
      <div className="p-6 border border-border rounded-md">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Security Best Practices</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                <span>Use a unique password that you don&apos;t use anywhere else</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                <span>Consider using a password manager to generate and store strong passwords</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                <span>Never share your password with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                <span>Change your password if you suspect it has been compromised</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
