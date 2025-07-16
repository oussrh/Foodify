import AdminHeader from '@/components/admin/header'
import AdminSidebar from '@/components/admin/sidebar'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

function getPathname() {
  const list = headers()
  const headerNames = [
    'next-url',
    'x-url',
    'x-pathname',
    'x-original-url',
    'x-rewrite-url',
    'referer',
  ]
  for (const name of headerNames) {
    const value = list.get(name)
    if (!value) continue
    try {
      const url = new URL(value, 'http://n')
      return url.pathname
    } catch {
      if (value.startsWith('/')) return value.split('?')[0]
    }
  }
  return ''
}

interface LayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: LayoutProps) {
  const pathname = getPathname()
  const isLoginPage = pathname.startsWith('/admin/login')

  const session = await auth()

  if (!session) {
    if (isLoginPage) {
      return (
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 p-6">{children}</main>
        </div>
      )
    }
    redirect('/admin/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { role: true },
  })

  if (user?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const hideLayout = isLoginPage

  return (
    <div className="flex min-h-screen flex-col">
      {!hideLayout && <AdminHeader />}
      <div className="flex flex-1">
        {!hideLayout && <AdminSidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
