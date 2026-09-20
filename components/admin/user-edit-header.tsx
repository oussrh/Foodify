import Link from 'next/link'
import { ArrowLeft, Building2, Shield, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UserEditHeaderProps {
  id: string
  email: string
  totalRestaurants: number
  totalDishes: number
}

/** The header of the user edit page: the way back, the title, the account line with its counts, the portal badge and the restaurants link. */
export function UserEditHeader({ id, email, totalRestaurants, totalDishes }: UserEditHeaderProps) {
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
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-md">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Edit User Account</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{email}</span>
              <span>•</span>
              <span>{totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{totalDishes} dishes</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user account details and restaurant assignments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground border-border">
            <Shield className="h-3 w-3 mr-1" />
            Admin Portal
          </Badge>
          <Button variant="outline" size="sm" asChild className="border-border text-muted-foreground hover:bg-muted">
            <Link href={`/admin/users/${id}/restaurants`}>
              <Building2 className="h-4 w-4 mr-2" />
              Manage Restaurants
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
