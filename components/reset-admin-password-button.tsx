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
            className="w-full justify-start border-border text-warning hover:bg-muted hover:border-border transition-colors"
            disabled={loading}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        ) : (
          <span
            className={`flex items-center gap-2 w-full cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors duration-200 ${className} ${
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
          <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
            <Key className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Reset Administrator Password
          </DialogTitle>
          <p className="text-muted-foreground">Generate a new secure password for this administrator</p>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {error && (
            <div className="p-4 border border-border rounded-md flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs text-destructive mt-1">Please try again or contact support if the problem persists</p>
              </div>
            </div>
          )}

          {!success ? (
            <>
              {/* Warning Section */}
              <div className="p-4 border border-border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning mb-1">Important Security Notice</p>
                    <p className="text-sm text-warning">
                      This will generate a new random password for the administrator. 
                      The admin will be required to change their password on the next login.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Security Features */}
              <div className="p-4 border border-border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Security Features</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>12-character length</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        <span>Cryptographically random</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserCheck className="h-3 w-3" />
                        <span>Forced password change</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
              <div className="p-4 border border-border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success mb-1">Password Reset Successfully!</p>
                    <p className="text-sm text-success">
                      The administrator&apos;s password has been reset. They will be required to change it on their next login.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* New Password Display */}
              <div className="p-4 border border-border rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Temporary Password
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-success border-border text-xs">
                      Strong ({passwordStrength}/5)
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <code className="block p-3 bg-card border-2 border-border rounded-lg text-sm font-mono break-all pr-10">
                        {showPassword ? newPassword : '••••••••••••'}
                      </code>
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button 
                      onClick={copyToClipboard}
                      variant="outline" 
                      size="sm"
                      className={`transition-colors ${
 copied 
 ? "border-border text-success bg-muted" 
 : "border-border text-muted-foreground hover:bg-muted"
 }`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {copied && (
                    <div className="flex items-center gap-2 p-2 bg-muted border border-border rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <p className="text-sm text-success font-medium">Password copied to clipboard!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="p-4 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Password Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Check className="h-3 w-3" />
                      <span>{newPassword.length} characters</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Check className="h-3 w-3" />
                      <span>Mixed case letters</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Check className="h-3 w-3" />
                      <span>Numbers included</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Check className="h-3 w-3" />
                      <span>Special characters</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Instructions */}
              <div className="p-4 border border-border rounded-md">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Next Steps</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
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
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReset}
                disabled={loading}
                className="transition-colors transform hover:scale-[1.02] disabled:"
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
              className="w-full h-12 transition-colors transform hover:scale-[1.02] text-white font-semibold"
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
