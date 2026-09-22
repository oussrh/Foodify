import SignInFlow from '@/components/auth/sign-in-flow'

/** Where a kitchen tablet signs in: a password, no second factor, and the session is kept for a month. */
export default function KitchenLoginPage() {
  return <SignInFlow portal="kitchen" />
}
