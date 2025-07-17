import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ManagerLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined },
      select: { role: true },
    })

    if (user?.role === 'RESTAURANT_ADMIN') {
      redirect('/manager')
    }
    if (user?.role === 'SUPER_ADMIN') {
      redirect('/admin')
    }
  }

  return <>{children}</>
}
