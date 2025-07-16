import prisma from '@/lib/prisma'
import AdminHeader from '@/components/admin/header'
import AdminSidebar from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader restaurants={restaurants} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
