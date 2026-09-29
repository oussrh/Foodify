// PathFile: app/manager/(protected)/profile/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shell/page-header'
import { ProfileCard } from '@/components/account/profile-card'
import { SecurityCards } from '@/components/account/security-cards'
import { ActivityCard } from '@/components/manager/profile/activity-card'
import { RestaurantsCard } from '@/components/manager/profile/restaurants-card'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      lastLogin: true,
      mfaEnabled: true,
      restaurants: { select: { id: true, code: true, name: true, slug: true }, orderBy: { name: 'asc' } },
    },
  })
  if (!user) notFound()

  const activity = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, action: true, createdAt: true, status: true },
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Account" description="Your profile, sign-in and password." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ProfileCard
            email={user.email}
            emailVerified={user.emailVerified}
            role={user.role}
            createdAt={user.createdAt}
            lastLogin={user.lastLogin}
            changeEmailHref="/manager/change-email"
          />
          <SecurityCards mfaEnabled={user.mfaEnabled} />
        </div>
        <div className="flex flex-col gap-6">
          <RestaurantsCard restaurants={user.restaurants} />
          <ActivityCard activity={activity} />
        </div>
      </div>
    </div>
  )
}
