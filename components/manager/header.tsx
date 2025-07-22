// PathFile: components/manager/header.tsx
'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import ManagerSidebar from './sidebar'
import { Menu, LogOut, Users, ChefHat } from 'lucide-react'

export default function ManagerHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg hover:bg-accent transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 md:hidden">
              <ManagerSidebar className="w-full border-0" />
            </SheetContent>
          </Sheet>

          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground leading-none">
                Foodify Manager
              </h1>
              <Badge 
                variant="secondary" 
                className="text-xs px-1.5 py-0 h-4 mt-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <Users className="h-2.5 w-2.5 mr-1" />
                Manager Portal
              </Badge>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => signOut({ redirect: true, callbackUrl: '/manager/login' })}
            className="h-9 px-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent hover:border-border transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
