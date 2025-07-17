import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import UpdateEmailForm from '@/components/update-email-form'
import UpdatePasswordForm from '@/components/update-password-form'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { email: true, createdAt: true },
  })

  if (!user) {
    return <div className="py-12 text-center text-muted-foreground">User not found</div>
  }

  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Account created on {user.createdAt.toLocaleDateString()}</p>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Update Email</h3>
          <UpdateEmailForm defaultEmail={user.email} />
        </div>
        <div>
          <h3 className="font-semibold">Change Password</h3>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
