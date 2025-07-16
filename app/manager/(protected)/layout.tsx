import ManagerHeader from '@/components/manager/header'
import ManagerSidebar from '@/components/manager/sidebar'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default async function ManagerLayout({ children }: LayoutProps) {
  const session = await auth()

  if (!session) {
    redirect('/manager/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  })

  if (user?.role !== 'RESTAURANT_ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ManagerHeader />
      <div className="flex flex-1">
        <ManagerSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
