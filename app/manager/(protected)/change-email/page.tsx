import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import ChangeEmailForm from '@/components/change-email-form'

export default async function ChangeEmailPage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      newEmail: true,
      emailChangeToken: true,
      emailVerifyToken: true,
    },
  })

  if (!user) {
    return <div className="py-12 text-center text-muted-foreground">User not found</div>
  }

  const pending = !!user.emailChangeToken || !!user.emailVerifyToken
  let progress = ''
  if (user.emailVerifyToken) {
    progress = '✔️ Old email confirmed → ⏳ Waiting on new email'
  } else if (user.emailChangeToken) {
    progress = '⏳ Waiting on old email confirmation'
  }

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-2xl font-semibold tracking-tight">Change Email</h2>
      <p className="text-sm">Current email: {user.email}</p>
      <p className="text-xs text-muted-foreground">You’ll need to confirm this from your current address</p>
      {progress && <p className="text-sm">{progress}</p>}
      <ChangeEmailForm disabled={pending} />
    </div>
  )
}
