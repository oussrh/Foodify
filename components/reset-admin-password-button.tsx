"use client"

import { useState } from "react"
import { RotateCcw, Key, Check, Loader2 } from "lucide-react"
import { resetAdminPassword } from "@/app/actions/admin-user-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// Function to generate random password
function generateRandomPassword(length: number = 12): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
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

  const handleReset = async () => {
    if (loading) return
    setLoading(true)
    
    try {
      const randomPassword = generateRandomPassword(12)
      await resetAdminPassword(id, randomPassword)
      setNewPassword(randomPassword)
      setSuccess(true)
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword)
      alert('Password copied to clipboard!')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setNewPassword(null)
    setSuccess(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {className?.includes('flex-1') ? (
          <Button
            variant="outline"
            className="w-full justify-start border-orange-200 text-orange-600 hover:bg-orange-50"
            disabled={loading}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        ) : (
          <span
            className={`flex items-center gap-2 w-full cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${className} ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Reset Password</span>
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            Reset Administrator Password
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!success ? (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Warning:</strong> This will generate a new random password for the administrator. 
                  The admin will be required to change their password on the next login.
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Security Features:</strong>
                </p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>• 12-character random password with special characters</li>
                  <li>• Forces password change on next login</li>
                  <li>• Secure password generation</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Password Reset Successfully!</span>
                </div>
                <p className="text-sm text-green-700">
                  The administrator's password has been reset. They will be required to change it on their next login.
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">New Temporary Password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                    {newPassword}
                  </code>
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline" 
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Important:</strong> Share this password securely with the administrator.
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          {!success ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReset}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Reset Password
                  </div>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
