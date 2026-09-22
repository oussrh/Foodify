import SignInFlow from '@/components/auth/sign-in-flow'

/** Where a waiter signs in: a password, no second factor, and the session is kept for a month. */
export default function WaiterLoginPage() {
  return <SignInFlow portal="waiter" />
}
