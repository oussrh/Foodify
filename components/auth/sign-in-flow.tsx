'use client'

import { useEffect, useRef, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { signIn } from 'next-auth/react'
import { requestAdminOtp } from '@/app/actions/admin-auth-actions'
import { requestKitchenSignIn } from '@/app/actions/kitchen-auth-actions'
import { requestManagerOtp } from '@/app/actions/manager-auth-actions'
import { requestWaiterSignIn } from '@/app/actions/waiter-auth-actions'
import CredentialsStep from './credentials-step'
import CodeStep from './code-step'
import { issueOf } from '@/components/forms/schema-check'
import { otpCode, otpRequest } from '@/lib/schemas/user'

type Portal = 'admin' | 'manager' | 'kitchen' | 'waiter'
type Step = 'credentials' | 'code'

interface SignInFlowProps {
  portal: Portal
  /** Start on the code step (the /mfa routes). Falls back to credentials if nothing is pending. */
  initialStep?: Step
}

const CONFIG = {
  admin: {
    label: 'Super admin',
    identifier: 'email' as const,
    hint: 'We’ll email you a one-time code after this step.',
    request: requestAdminOtp,
    authRole: 'SUPER_ADMIN',
    home: '/admin' as Route,
    login: '/admin/login' as Route,
    storage: ['adminEmail', 'adminPassword'] as const,
  },
  manager: {
    label: 'Restaurant manager',
    identifier: 'email' as const,
    hint: 'We’ll email you a one-time code after this step.',
    request: requestManagerOtp,
    authRole: 'RESTAURANT_ADMIN',
    home: '/manager' as Route,
    login: '/manager/login' as Route,
    storage: ['managerEmail', 'managerPassword'] as const,
  },
  // Someone on the floor with a phone: a password and nothing else, and they land on the tables.
  waiter: {
    label: 'Waiter',
    identifier: 'username' as const,
    hint: 'You’ll be signed in straight away, and stay signed in for a month.',
    request: requestWaiterSignIn,
    authRole: 'WAITER',
    home: '/waiter' as Route,
    login: '/waiter/login' as Route,
    storage: ['waiterEmail', 'waiterPassword'] as const,
  },
  // The tablet in the kitchen: a password and nothing else, and it lands on its board.
  kitchen: {
    label: 'Kitchen tablet',
    identifier: 'username' as const,
    hint: 'The tablet will be signed in straight away, and stay signed in for a month.',
    request: requestKitchenSignIn,
    authRole: 'KITCHEN',
    home: '/kitchen' as Route,
    login: '/kitchen/login' as Route,
    storage: ['kitchenEmail', 'kitchenPassword'] as const,
  },
}

const CODE_TTL = 600

/**
 * The one sign-in for every portal: password first, then the emailed code if the account has the
 * second factor on. Between the steps the credentials sit in sessionStorage so the /mfa route can
 * finish.
 */
export default function SignInFlow({ portal, initialStep = 'credentials' }: SignInFlowProps) {
  const cfg = CONFIG[portal]
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

  const codeRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (step === 'code' && initialStep !== 'code') codeRef.current?.focus()
  }, [step, initialStep])

  useEffect(() => {
    if (step !== 'code') return
    const timer = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000)
    return () => clearInterval(timer)
  }, [step])

  // The credentials callback, with or without a code; a session opened clears the stored credentials and goes home.
  const finishSignIn = async (code?: string) => {
    const res = await signIn('credentials', { email, password, code, role: cfg.authRole, redirect: false })
    if (res?.error) return false
    sessionStorage.removeItem(ek)
    sessionStorage.removeItem(pk)
    router.push(cfg.home)
    router.refresh()
    return true
  }

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    // The first step's own schema (loose on purpose: present and bounded), checked before the request.
    if (!otpRequest.safeParse({ email, password }).success) {
      setError(`Enter your ${cfg.identifier} and password.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await cfg.request(email, password)
      if ('error' in res) {
        setError(res.error)
        return
      }
      // The account has the second factor off: the same credentials open the session now.
      if (!res.mfa) {
        if (!(await finishSignIn())) setError('Something went wrong. Try again.')
        return
      }
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
    const problem = issueOf(otpCode, code)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      if (!(await finishSignIn(code))) setError('That code is not right or has expired.')
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
      if ('error' in res) setError(res.error)
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
    sessionStorage.removeItem(ek)
    sessionStorage.removeItem(pk)
    setCode('')
    setError('')
    setStep('credentials')
    if (initialStep === 'code') router.replace(cfg.login)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Foodify
          <span className="ml-auto text-xs font-medium text-muted-foreground">{cfg.label}</span>
        </div>

        {step === 'credentials' ? (
          <CredentialsStep
            email={email}
            password={password}
            onEmail={setEmail}
            onPassword={setPassword}
            onSubmit={submitCredentials}
            error={error}
            busy={busy}
            hint={cfg.hint}
            identifier={cfg.identifier}
          />
        ) : (
          <CodeStep
            email={email}
            code={code}
            onCode={setCode}
            onSubmit={submitCode}
            codeRef={codeRef}
            error={error}
            busy={busy}
            timeLeft={timeLeft}
            resendLocked={timeLeft > CODE_TTL - 30}
            resending={resending}
            onResend={resend}
            onStartOver={startOver}
          />
        )}
      </div>
    </main>
  )
}
