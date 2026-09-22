import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { PageHeader } from '@/components/shell/page-header'
import { ProfileCard } from '@/components/account/profile-card'
import { SecurityCards } from '@/components/account/security-cards'

/** The signed-in super admin's own account: the profile facts, the second factor and the password. */
export default async function AdminProfilePage() {
  const me = await requireSuperAdminPage()
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { email: true, emailVerified: true, role: true, createdAt: true, lastLogin: true, mfaEnabled: true },
  })
  if (!user) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Account" description="Your profile, sign-in and password." />
      <div className="flex max-w-3xl flex-col gap-6">
        <ProfileCard email={user.email} emailVerified={user.emailVerified} role={user.role} createdAt={user.createdAt} lastLogin={user.lastLogin} />
        <SecurityCards mfaEnabled={user.mfaEnabled} />
      </div>
    </div>
  )
}
