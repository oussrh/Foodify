import ManagerHeader from '@/components/manager/header'
import ManagerSidebar from '@/components/manager/sidebar'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

interface LayoutProps {
  children: React.ReactNode
}

export default async function ManagerLayout({ children }: LayoutProps) {
  const headerList = headers()
  const pathname = headerList.get('next-url') || ''
  const isLoginPage = pathname.startsWith('/manager/login')
  const session = await auth()

  if (!session) {
    if (isLoginPage) {
      return (
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 p-6">{children}</main>
        </div>
      )
    }
    redirect('/manager/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== 'RESTAURANT_ADMIN') {
    redirect('/')
  }

  const hideLayout = isLoginPage

  return (
    <div className="flex min-h-screen flex-col">
      {!hideLayout && <ManagerHeader />}
      <div className="flex flex-1">
        {!hideLayout && <ManagerSidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
