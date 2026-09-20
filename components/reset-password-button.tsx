// components/reset-password-button.tsx
'use client'

import { forwardRef, useState, type ButtonHTMLAttributes } from 'react'
import { RotateCcw } from 'lucide-react'
import { resetClientPassword } from '@/app/actions/client-actions'

interface ResetPasswordButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id: string
}

/**
 * Resets a manager's password. Rendered on its own or as the child of a DropdownMenuItem asChild,
 * which hands it the menu item's role, ref and keyboard handling: they must reach the button.
 */
const ResetPasswordButton = forwardRef<HTMLButtonElement, ResetPasswordButtonProps>(function ResetPasswordButton(
  { id, className = '', onClick, ...props },
  ref,
) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (loading) return
    setLoading(true)
    await resetClientPassword(id, 'newpassword123')
    setLoading(false)
    alert('Password reset to "newpassword123"')
  }

  return (
    <button
      ref={ref}
      type="button"
      {...props}
      onClick={handleClick}
      disabled={loading || props.disabled}
      className={`flex items-center gap-2 w-full text-left disabled:opacity-50 ${className}`}
    >
      <RotateCcw className="h-4 w-4" />
      <span>Reset Password</span>
    </button>
  )
})

export default ResetPasswordButton
