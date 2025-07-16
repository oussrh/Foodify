'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const router = useRouter()

  const onCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn('credentials', { email, password, code, redirect: false })
    router.push('/admin')
  }

  const onEmail = async () => {
    await signIn('resend', { email, redirect: false })
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <form onSubmit={onCredentials} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="code">Two-factor code</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Sign in with Password</Button>
      </form>
      <div className="text-center">or</div>
      <Button variant="outline" className="w-full" onClick={onEmail}>
        Send Sign-In Email
      </Button>
    </div>
  )
}
