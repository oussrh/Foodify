'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ShellRole } from './shell-types'

interface UserMenuProps {
  role: ShellRole
  user: { email: string }
}

/** The avatar button: who is signed in, their account page (managers), sign out. */
export default function UserMenu({ role, user }: UserMenuProps) {
  const initials = user.email.slice(0, 2).toUpperCase()
  const loginPath = role === 'admin' ? '/admin/login' : '/manager/login'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.email}</span>
          <span className="block text-xs text-muted-foreground">{role === 'admin' ? 'Super admin' : 'Restaurant manager'}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === 'manager' && (
          <DropdownMenuItem asChild>
            <Link href="/manager/profile">Account settings</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => signOut({ redirect: true, callbackUrl: loginPath })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
