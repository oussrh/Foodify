import SignInFlow from '@/components/auth/sign-in-flow'

export default function ManagerMFAPage() {
  return <SignInFlow role="manager" initialStep="code" />
}
