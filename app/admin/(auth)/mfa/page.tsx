'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function AdminMFAPage() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    setEmail(sessionStorage.getItem('adminEmail') || '')
    setPassword(sessionStorage.getItem('adminPassword') || '')
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signIn('credentials', {
      email,
      password,
      code,
      role: 'SUPER_ADMIN',
      redirect: false,
    })
    if (res?.error) {
      alert(res.error)
      return
    }
    sessionStorage.removeItem('adminEmail')
    sessionStorage.removeItem('adminPassword')
    router.push('/admin')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-xl font-semibold text-center">Enter Verification Code</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="code">6-digit Code</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Verify</Button>
      </form>
    </div>
  )
}
