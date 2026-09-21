import AppShell from '@/components/shell/app-shell'
import prisma from '@/lib/prisma'
import { requireSuperAdminPage } from '@/lib/auth-guard'

interface LayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: LayoutProps) {
  // The same check every page repeats: the layout is preserved across client navigations.
  const user = await requireSuperAdminPage()

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <AppShell portal="admin" user={{ email: user.email }} restaurants={restaurants}>
      {children}
    </AppShell>
  )
}
