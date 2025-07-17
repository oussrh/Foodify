import Link from 'next/link'
import prisma from '@/lib/prisma'
import EditAdminForm, { EditAdminValues } from '@/components/edit-admin-form'
import { buttonVariants } from '@/components/ui/button'

export default async function EditAdminPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const admin = await prisma.user.findUnique({ where: { id } })
  
  if (!admin) {
    return <div>Admin not found</div>
  }
  
  const defaultValues: EditAdminValues = { email: admin.email }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Admin</h2>
        <Link href="/admin/admins" className={buttonVariants({ variant: 'outline' })}>
          Back to Admins
        </Link>
      </div>
      <EditAdminForm id={admin.id} defaultValues={defaultValues} />
    </div>
  )
}
