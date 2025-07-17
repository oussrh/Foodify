import Link from 'next/link'
import { buttonVariants, Button } from '@/components/ui/button'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'
import prisma from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

export default async function AdminsPage() {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Admins</h2>
        <Link href="/admin/admins/create" className={buttonVariants({ variant: 'default' })}>
          Create Admin
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Admins</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admins found.</p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((u: any, i: number) => (
                  <tr
                    key={u.id}
                    className={`border-b hover:bg-muted/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3">{u.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background rounded-md shadow-lg border border-border">
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/admin/admins/${u.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <ResetAdminPasswordButton id={u.id} />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
