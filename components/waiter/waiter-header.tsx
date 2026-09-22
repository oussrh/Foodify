// components/waiter/waiter-header.tsx
// The strip both top-level screens wear: what you are looking at, whose restaurant it is, whether
// the server is answering, and a refresh. It stays a strip rather than growing controls, because
// the tab bar at the bottom is where a thumb goes and the top of a phone is where it does not.
'use client'

import { RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WaiterHeaderProps {
  title: string
  restaurantName: string
  /** False after a poll has failed; the screen keeps its last answer rather than blanking. */
  online: boolean
  loading: boolean
  onRefresh: () => void
  /** Controls that belong to one screen only, before the refresh. */
  children?: React.ReactNode
}

export function WaiterHeader({ title, restaurantName, online, loading, onRefresh, children }: WaiterHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold leading-tight tracking-display">{title}</h1>
        <p className="truncate text-xs text-muted-foreground">{restaurantName}</p>
      </div>
      {!online && (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Offline
        </span>
      )}
      {children}
      <Button variant="outline" className="h-12 min-w-12 px-3" onClick={onRefresh} aria-label="Check the kitchen again">
        <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
      </Button>
    </div>
  )
}
