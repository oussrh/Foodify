// components/password-form/password-strength.tsx
// The five checks a new password must pass (the same rules as lib/schemas/user's
// passwordChange), the tier a score maps to, and the indicator that shows both.
'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Check, Shield, X, Zap } from 'lucide-react'

export type PasswordCheck = { label: string; test: boolean }

// Password strength validation
export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'One uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', test: /[a-z]/.test(password) },
    { label: 'One number', test: /[0-9]/.test(password) },
    { label: 'One special character', test: /[^A-Za-z0-9]/.test(password) },
  ]
}

type Tier = { level: string; color: string; icon: ReactNode; bar: string }

const VERY_WEAK: Tier = { level: 'Very Weak', color: 'text-destructive bg-muted border-border', icon: <X className="h-3 w-3" />, bar: 'bg-destructive' }
const TIERS: { min: number; tier: Tier }[] = [
  { min: 5, tier: { level: 'Strong', color: 'text-success bg-muted border-border', icon: <Shield className="h-3 w-3" />, bar: '' } },
  { min: 3, tier: { level: 'Medium', color: 'text-warning bg-muted border-border', icon: <Zap className="h-3 w-3" />, bar: '' } },
  { min: 1, tier: { level: 'Weak', color: 'text-warning bg-muted border-border', icon: <AlertTriangle className="h-3 w-3" />, bar: '' } },
]

/** The tier of a score out of five: 5 is strong, 3 and 4 medium, 1 and 2 weak, anything less very weak. */
export function strengthTier(score: number): Tier {
  return TIERS.find((t) => score >= t.min)?.tier ?? VERY_WEAK
}

export function PasswordStrengthIndicator({ checks, score }: { checks: PasswordCheck[]; score: number }) {
  const tier = strengthTier(score)
  return (
    <div className="space-y-4 p-4 rounded-md border border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Password strength</span>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${tier.color}`}>
          {tier.icon}
          {tier.level}
        </div>
      </div>

      {/* Strength Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Weak</span>
          <span>Strong</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-colors ${tier.bar}`}
            style={{ width: `${(score / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Requirements</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg transition-colors">
              <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors bg-muted">
                {check.test ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm transition-colors duration-200 ${check.test ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
