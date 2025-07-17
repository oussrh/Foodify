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
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await requestAdminOtp(email, password)
      if (res?.error) {
        setError(res.error)
        return
      }
      if (res?.success) {
        sessionStorage.setItem('adminEmail', email)
        sessionStorage.setItem('adminPassword', password)
        router.push('/admin/mfa')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      
      <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
        <h3 className="font-semibold mb-2">Test Credentials:</h3>
        <p><strong>Email:</strong> ousrh7@gmail.com</p>
        <p><strong>Password:</strong> changeme</p>
        <p className="text-gray-600 mt-2">
          Note: This will send an OTP to the email if RESEND_API_KEY is configured.
        </p>
      </div>
    </div>
  )
}
