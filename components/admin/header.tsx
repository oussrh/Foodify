// FilePath: components/admin/header.tsx

'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import AdminSidebar from './sidebar'
import { Menu, LogOut, Shield, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50) // Show logo in header when scrolled more than 50px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              <AdminSidebar className="w-full border-0" />
            </SheetContent>
          </Sheet>

          {/* Animated Logo - only shows when scrolled */}
          <div className={cn(
            "flex items-center gap-3 transition-all duration-500 ease-in-out",
            isScrolled 
              ? "opacity-100 translate-x-0 scale-100" 
              : "opacity-0 -translate-x-8 scale-95 pointer-events-none"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground leading-none">
                Foodify Admin
              </h1>
              <Badge 
                variant="secondary" 
                className="text-xs px-1.5 py-0 h-4 mt-0.5 bg-primary/10 text-primary border-primary/20"
              >
                <Shield className="h-2.5 w-2.5 mr-1" />
                Admin Portal
              </Badge>
            </div>
          </div>

          {/* Placeholder for consistent spacing when logo is hidden */}
          {!isScrolled && (
            <div className="w-4" /> // Small spacer to maintain layout
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => signOut({ redirect: true, callbackUrl: '/admin/login' })}
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
