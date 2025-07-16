import AdminHeader from '@/components/admin/header'
import AdminSidebar from '@/components/admin/sidebar'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: LayoutProps) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { role: true },
  })

  if (user?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
