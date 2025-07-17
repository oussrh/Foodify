'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import ManagerSidebar from './sidebar'
import { Menu } from 'lucide-react'

export default function ManagerHeader() {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 md:hidden">
            <ManagerSidebar className="w-full" />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold">Foodify Manager</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" onClick={() => signOut({ redirect: true, callbackUrl: '/manager/login' })}>
          Sign Out
        </Button>
      </div>
    </header>
  )
}
