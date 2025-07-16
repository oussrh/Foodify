'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { resetClientPassword } from '@/app/actions/client-actions'

export default function ResetPasswordButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await resetClientPassword(id, 'newpassword123')
    setLoading(false)
    alert('Password reset to "newpassword123"')
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
      Reset Password
    </Button>
  )
}
