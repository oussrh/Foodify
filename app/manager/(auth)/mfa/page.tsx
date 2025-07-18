'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Mail, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { requestManagerOtp } from '@/app/actions/manager-auth-actions'

export default function ManagerMFAPage() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const router = useRouter()

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('managerEmail')
    const storedPassword = sessionStorage.getItem('managerPassword')
    
    if (!storedEmail || !storedPassword) {
      router.push('/manager/login')
      return
    }
    
    setEmail(storedEmail)
    setPassword(storedPassword)
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        code,
        role: 'RESTAURANT_ADMIN',
        redirect: false,
      })
      
      if (res?.error) {
        setError('Invalid verification code. Please check and try again.')
        return
      }
      
      sessionStorage.removeItem('managerEmail')
      sessionStorage.removeItem('managerPassword')
      router.push('/manager')
    } catch (err) {
      console.error('MFA verification error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setResending(true)
    setError('')
    
    try {
      const res = await requestManagerOtp(email, password)
      if (res?.error) {
        setError(res.error)
      } else {
        setTimeLeft(600) // Reset timer
        setCode('') // Clear current code
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
          <p className="text-gray-600 mt-2">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                Verification Code
              </Label>
              <Input 
                id="code" 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest h-14 border-gray-200 focus:border-green-400 focus:ring-green-400"
                maxLength={6}
                required
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  Code expires in: <span className="font-medium text-red-500">{formatTime(timeLeft)}</span>
                </span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
              disabled={loading || code.length !== 6 || timeLeft === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Verify & Sign In
                </>
              )}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
          
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Button
                variant="outline"
                onClick={resendCode}
                disabled={resending || timeLeft > 540} // Allow resend after 1 minute
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <Link 
                href="/manager/login"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-xs text-center">
              💡 Tip: Check your spam folder if you don&apos;t see the email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}