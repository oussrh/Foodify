import AppShell from '@/components/shell/app-shell'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

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
    select: { role: true, email: true, restaurants: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
  })

  if (!user) {
    redirect('/manager/login')
  }

  if (user.role !== 'RESTAURANT_ADMIN') {
    if (user.role === 'SUPER_ADMIN') {
      redirect('/admin')
    }
    redirect('/')
  }

  return (
    <AppShell portal="manager" user={{ email: user.email }} restaurants={user.restaurants}>
      {children}
    </AppShell>
  )
}
