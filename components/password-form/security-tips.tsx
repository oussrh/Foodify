// components/password-form/security-tips.tsx
// The "Security Best Practices" card under the update-password form.
import { Shield } from 'lucide-react'

const TIPS = [
  "Use a unique password that you don't use anywhere else",
  'Consider using a password manager to generate and store strong passwords',
  'Never share your password with anyone',
  'Change your password if you suspect it has been compromised',
]

export default function SecurityTips() {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Security Best Practices</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
