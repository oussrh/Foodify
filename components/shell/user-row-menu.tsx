'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ManagerPasswordDialog from '@/components/admin/manager-password-dialog'

interface UserRowMenuProps {
  userId: string
  email: string
}

/** Row actions for a restaurant manager. The password dialog sits outside the menu, which unmounts on select. */
export function ManagerRowMenu({ userId, email }: UserRowMenuProps) {
  const [password, setPassword] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Actions for ${email}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${userId}/edit` as Route}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${userId}/restaurants` as Route}>Restaurants</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setPassword(true)}>Set password</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ManagerPasswordDialog open={password} onOpenChange={setPassword} userId={userId} email={email} />
    </>
  )
}
