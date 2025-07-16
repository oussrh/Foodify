'use client'

import { ThemeToggle } from '@/components/theme-toggle'

export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <h1 className="text-lg font-bold">Foodify Admin</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
