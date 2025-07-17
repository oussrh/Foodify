'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestAdminOtp } from '@/app/actions/admin-auth-actions'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await requestAdminOtp(email, password)
    if (res?.error) {
      setError(res.error)
      return
    }
    sessionStorage.setItem('adminEmail', email)
    sessionStorage.setItem('adminPassword', password)
    router.push('/admin/mfa')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-xl font-semibold text-center">Super Admin Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Sign In</Button>
      </form>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
    </div>
  )
}
