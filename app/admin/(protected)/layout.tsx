import AppShell from '@/components/shell/app-shell'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: LayoutProps) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/admin/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, email: true },
  })

  if (user?.role !== 'SUPER_ADMIN') {
    if (user?.role === 'RESTAURANT_ADMIN') {
      redirect('/manager')
    }
    redirect('/')
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <AppShell role="admin" user={{ email: user.email }} restaurants={restaurants}>
      {children}
    </AppShell>
  )
}
