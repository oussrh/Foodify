// PathFile: components/reset-admin-password-button.tsx
"use client"

import { useState, useCallback } from "react"
import { Key, X } from "lucide-react"
import { resetAdminPassword } from "@/app/actions/admin-user-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateRandomPassword, getPasswordStrength } from "@/components/reset-password/random-password"
import ResetIntro from "@/components/reset-password/reset-intro"
import NewPasswordPanel from "@/components/reset-password/new-password-panel"
import ResetFooter from "@/components/reset-password/reset-footer"

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
            <ResetIntro />
          ) : (
            <NewPasswordPanel
              newPassword={newPassword}
              passwordStrength={passwordStrength}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              copied={copied}
              onCopy={copyToClipboard}
            />
          )}
        </div>

        <ResetFooter success={success} loading={loading} onClose={handleClose} onReset={handleReset} />
      </DialogContent>
    </Dialog>
  )
}
