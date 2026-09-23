// components/account/security-cards.tsx
// The two sign-in cards of an account page, shared by both portals: the second-factor switch,
// then the password form.
import MfaCheckbox from '@/components/mfa-checkbox'
import UpdatePasswordForm from '@/components/update-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * The Account page's two sign-in cards, shared by both portals: the two-factor checkbox, then the
 * password form.
 */
export function SecurityCards({ mfaEnabled }: { mfaEnabled: boolean }) {
  return (
    <>
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>A second step at sign-in, after the password.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <MfaCheckbox enabled={mfaEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Password</CardTitle>
          <CardDescription>At least eight characters, with a capital, a small letter, a digit and a symbol.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </>
  )
}
