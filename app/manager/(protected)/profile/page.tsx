// PathFile: app/manager/(protected)/profile/page.tsx
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { daysSince } from '@/lib/time'
import { AccountOverviewCard } from '@/components/manager/profile/account-overview-card'
import { AccountStatsCard, MyRestaurantsCard, RecentActivityCard, SecurityCard } from '@/components/manager/profile/account-cards'
import { ProfileHeader, ProfileNotFound } from '@/components/manager/profile/profile-header'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      createdAt: true,
      lastLogin: true,
      role: true,
      emailVerified: true,
      restaurants: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          slug: true
        }
      }
    },
  })

  if (!user) {
    return <ProfileNotFound />
  }

  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      action: true,
      createdAt: true,
      ipAddress: true,
      status: true
    }
  }).catch(() => []) // Fallback if activityLog table doesn't exist

  const accountAge = daysSince(user.createdAt)
  const isNewAccount = accountAge < 30

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <ProfileHeader emailVerified={user.emailVerified} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Overview - Spans 2 columns */}
        <AccountOverviewCard user={user} isNewAccount={isNewAccount} />

        {/* Account Stats */}
        <AccountStatsCard accountAge={accountAge} restaurantCount={user.restaurants.length} activityCount={recentActivity.length} />

        {/* Security Settings - Full width */}
        <SecurityCard />

        {/* Recent Activity */}
        <RecentActivityCard activity={recentActivity} />

        {/* My Restaurants */}
        {user.restaurants.length > 0 && <MyRestaurantsCard restaurants={user.restaurants} />}
      </div>
    </div>
  )
}
