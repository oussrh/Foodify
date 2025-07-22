// PathFile: components/reset-admin-password-button.tsx
"use client"

import { useState, useCallback } from "react"
import { 
  RotateCcw, 
  Key, 
  Check, 
  Loader2, 
  Shield, 
  AlertTriangle, 
  Copy, 
  Eye, 
  EyeOff,
  CheckCircle2,
  X,
  RefreshCw,
  Lock,
  UserCheck,
  Mail,
  Clock
} from "lucide-react"
import { resetAdminPassword } from "@/app/actions/admin-user-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// Enhanced password generator with better character distribution
function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*"
  
  // Ensure at least one character from each category
  let password = ""
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += symbols.charAt(Math.floor(Math.random() * symbols.length))
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export default function ResetAdminPasswordButton({
  id,
  className,
}: {
  id: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    
    try {
      const randomPassword = generateRandomPassword(12)
      await resetAdminPassword(id, randomPassword)
      setNewPassword(randomPassword)
      setSuccess(true)
    } catch (error) {
      console.error('Error resetting password:', error)
      setError('Failed to reset password. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = useCallback(async () => {
    if (newPassword) {
      try {
        await navigator.clipboard.writeText(newPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch (err) {
        console.error('Copy failed:', err)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = newPassword
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    }
  }, [newPassword])

  const handleClose = () => {
    setIsOpen(false)
    setNewPassword(null)
    setSuccess(false)
    setError(null)
    setCopied(false)
    setShowPassword(false)
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {className?.includes('flex-1') ? (
          <Button
            variant="outline"
            className="w-full justify-start border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
            disabled={loading}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        ) : (
          <span
            className={`flex items-center gap-2 w-full cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors duration-200 ${className} ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Reset Password</span>
          </span>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Key className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Reset Administrator Password
          </DialogTitle>
          <p className="text-gray-600">Generate a new secure password for this administrator</p>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600 mt-1">Please try again or contact support if the problem persists</p>
              </div>
            </div>
          )}

          {!success ? (
            <>
              {/* Warning Section */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 mb-1">Important Security Notice</p>
                    <p className="text-sm text-amber-800">
                      This will generate a new random password for the administrator. 
                      The admin will be required to change their password on the next login.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Security Features */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">Security Features</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1 text-xs text-blue-700">
                        <Lock className="h-3 w-3" />
                        <span>12-character length</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-blue-700">
                        <RefreshCw className="h-3 w-3" />
                        <span>Cryptographically random</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-blue-700">
                        <UserCheck className="h-3 w-3" />
                        <span>Forced password change</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-blue-700">
                        <Clock className="h-3 w-3" />
                        <span>Immediate activation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 mb-1">Password Reset Successfully!</p>
                    <p className="text-sm text-green-700">
                      The administrator&apos;s password has been reset. They will be required to change it on their next login.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* New Password Display */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Temporary Password
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      Strong ({passwordStrength}/5)
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <code className="block p-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-mono break-all pr-10">
                        {showPassword ? newPassword : '••••••••••••'}
                      </code>
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button 
                      onClick={copyToClipboard}
                      variant="outline" 
                      size="sm"
                      className={`transition-all duration-200 ${
                        copied 
                          ? "border-green-200 text-green-600 bg-green-50" 
                          : "border-blue-200 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {copied && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">Password copied to clipboard!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Password Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1 text-purple-700">
                      <Check className="h-3 w-3" />
                      <span>{newPassword.length} characters</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-700">
                      <Check className="h-3 w-3" />
                      <span>Mixed case letters</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-700">
                      <Check className="h-3 w-3" />
                      <span>Numbers included</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-700">
                      <Check className="h-3 w-3" />
                      <span>Special characters</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Instructions */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Next Steps</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Share this password securely with the administrator</li>
                      <li>• Recommend using encrypted communication</li>
                      <li>• Admin must change password on first login</li>
                      <li>• Consider enabling two-factor authentication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="gap-3 mt-6">
          {!success ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReset}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span>Reset Password</span>
                  </div>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleClose}
              className="w-full h-12 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-white font-semibold"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span>Done</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
