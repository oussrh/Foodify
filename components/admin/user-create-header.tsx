import Link from 'next/link'
import { ArrowLeft, Shield, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/** The header of the manager create page: the way back, the title, how many restaurants can be assigned, the portal badge. */
export function UserCreateHeader({ restaurantCount }: { restaurantCount: number }) {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-md">
          <UserPlus className="h-8 w-8 text-success" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create New User</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">Restaurant Administrator</span>
            <span>•</span>
            <span>{restaurantCount} restaurants available</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new restaurant administrator account with access permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground border-border">
            <Shield className="h-3 w-3 mr-1" />
            Admin Portal
          </Badge>
        </div>
      </div>
    </div>
  )
}
