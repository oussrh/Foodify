import CreateAdminForm from '@/components/create-admin-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function CreateAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Create Admin</h2>
        <Link href="/admin/admins" className={buttonVariants({ variant: 'outline' })}>
          Back to Admins
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Admin Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAdminForm />
        </CardContent>
      </Card>
    </div>
  )
}
