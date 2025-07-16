'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function AdminHeader() {

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <h1 className="text-lg font-bold">Foodify Admin</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" onClick={() => signOut({ redirect: true, callbackUrl: '/admin/login' })}>
          Sign Out
        </Button>
      </div>
    </header>
  )
}
