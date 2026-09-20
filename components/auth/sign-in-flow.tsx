'use client'

import { useEffect, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestAdminOtp } from '@/app/actions/admin-auth-actions'
import { requestManagerOtp } from '@/app/actions/manager-auth-actions'

type Role = 'admin' | 'manager'
type Step = 'credentials' | 'code'

interface SignInFlowProps {
  role: Role
  /** Start on the code step (the /mfa routes). Falls back to credentials if nothing is pending. */
  initialStep?: Step
}

const CONFIG = {
  admin: {
    label: 'Super admin',
    request: requestAdminOtp,
    authRole: 'SUPER_ADMIN',
    home: '/admin' as Route,
    login: '/admin/login' as Route,
    storage: ['adminEmail', 'adminPassword'] as const,
  },
  manager: {
    label: 'Restaurant manager',
    request: requestManagerOtp,
    authRole: 'RESTAURANT_ADMIN',
    home: '/manager' as Route,
    login: '/manager/login' as Route,
    storage: ['managerEmail', 'managerPassword'] as const,
  },
}

const CODE_TTL = 600

export default function SignInFlow({ role, initialStep = 'credentials' }: SignInFlowProps) {
  const cfg = CONFIG[role]
  const router = useRouter()
  const [step, setStep] = useState<Step>(initialStep)
  // On the /mfa routes the credentials step left them in sessionStorage. They are read once, on
  // the first client render, and kept: the storage is cleared on success and on "start over",
  // and neither may send the page back to the login.
  const [ek, pk] = cfg.storage
  const storedEmail = useClientValue(() => (initialStep === 'code' ? sessionStorage.getItem(ek) ?? '' : ''), '')
  const storedPassword = useClientValue(() => (initialStep === 'code' ? sessionStorage.getItem(pk) ?? '' : ''), '')
  const hydrated = useClientValue(() => true, false)
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null)
  if (hydrated && pending === null) setPending({ email: storedEmail, password: storedPassword })
  const [typedEmail, setEmail] = useState<string | null>(null)
  const [typedPassword, setPassword] = useState<string | null>(null)
  const email = typedEmail ?? pending?.email ?? ''
  const password = typedPassword ?? pending?.password ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(CODE_TTL)

  // An /mfa route that loaded with nothing pending goes back to the login.
  useEffect(() => {
    if (pending && initialStep === 'code' && (!pending.email || !pending.password)) router.replace(cfg.login)
  }, [pending, initialStep, cfg, router])

  useEffect(() => {
    if (step !== 'code') return
    const timer = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000)
    return () => clearInterval(timer)
  }, [step])

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await cfg.request(email, password)
      if (res?.error) {
        setError(res.error)
        return
      }
      const [ek, pk] = cfg.storage
      sessionStorage.setItem(ek, email)
      sessionStorage.setItem(pk, password)
      setTimeLeft(CODE_TTL)
      setStep('code')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await signIn('credentials', { email, password, code, role: cfg.authRole, redirect: false })
      if (res?.error) {
        setError('That code is not right or has expired.')
        return
      }
      const [ek, pk] = cfg.storage
      sessionStorage.removeItem(ek)
      sessionStorage.removeItem(pk)
      router.push(cfg.home)
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError('')
    try {
      const res = await cfg.request(email, password)
      if (res?.error) setError(res.error)
      else {
        setTimeLeft(CODE_TTL)
        setCode('')
      }
    } catch {
      setError('Could not send a new code. Try again.')
    } finally {
      setResending(false)
    }
  }

  const startOver = () => {
    const [ek, pk] = cfg.storage
    sessionStorage.removeItem(ek)
    sessionStorage.removeItem(pk)
    setCode('')
    setError('')
    setStep('credentials')
    if (initialStep === 'code') router.replace(cfg.login)
  }

  const mm = Math.floor(timeLeft / 60)
  const ss = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Foodify
          <span className="ml-auto text-xs font-medium text-muted-foreground">{cfg.label}</span>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-display">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">We’ll email you a one-time code after this step.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={busy} className="mt-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-display">Enter your code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in{' '}
                <span className="tnum font-medium text-foreground">
                  {mm}:{ss}
                </span>
                .
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="tnum h-12 text-center text-2xl tracking-[0.4em]"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={busy || code.length !== 6} className="mt-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Verifying…' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={startOver} className="text-muted-foreground hover:text-foreground">
                Use another account
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={resending || timeLeft > CODE_TTL - 30}
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Send a new code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
