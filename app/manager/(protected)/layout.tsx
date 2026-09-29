import AppShell from '@/components/shell/app-shell'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { ROLE_HOME } from '@/lib/roles'

interface LayoutProps {
  children: React.ReactNode
}

export default async function ManagerLayout({ children }: LayoutProps) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/manager/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, email: true, restaurants: { select: { id: true, code: true, name: true }, orderBy: { name: 'asc' } } },
  })

  if (!user) {
    redirect('/manager/login')
  }

  // Anyone who is not a manager is sent to their own home rather than to the front page: a
  // tablet to its board, a waiter to its tables, a super admin to the admin portal.
  if (user.role !== 'RESTAURANT_ADMIN') {
    redirect(ROLE_HOME[user.role] as Route)
  }

  return (
    <AppShell portal="manager" user={{ email: user.email }} restaurants={user.restaurants}>
      {children}
    </AppShell>
  )
}
