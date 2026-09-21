import SignInFlow from '@/components/auth/sign-in-flow'

export default function AdminMFAPage() {
  return <SignInFlow portal="admin" initialStep="code" />
}
