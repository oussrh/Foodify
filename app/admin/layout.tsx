'use client'

import AdminHeader from '@/components/admin/header'
import AdminSidebar from '@/components/admin/sidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideLayout = pathname.startsWith('/admin/login')

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
