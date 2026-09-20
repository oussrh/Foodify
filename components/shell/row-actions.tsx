'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Star, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteDish, toggleDishStatus, toggleMostPurchased } from '@/app/actions/dish-actions'
import { deleteRestaurant } from '@/app/actions/restaurant-actions'
import { cn } from '@/lib/utils'

/** In-row "Live" toggle. Optimistic; reverts on failure. */
export function DishLiveSwitch({ dishId, isActive }: { dishId: string; isActive: boolean }) {
  const [checked, setChecked] = useState(isActive)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={checked ? 'Live — tap to hide from the menu' : 'Hidden — tap to show on the menu'}
      onCheckedChange={(next) => {
        setChecked(next)
        startTransition(async () => {
          try {
            await toggleDishStatus(dishId)
            router.refresh()
          } catch {
            setChecked(!next)
            toast.error('Could not update the dish')
          }
        })
      }}
    />
  )
}

const menuButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'

interface DishRowMenuProps {
  dishId: string
  dishName: string
  editHref: Route
  isMostPurchased: boolean
}

export function DishRowMenu({ dishId, dishName, editHref, isMostPurchased }: DishRowMenuProps) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const run = (fn: () => Promise<unknown>, done: string) =>
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
        toast.success(done)
      } catch {
        toast.error('Something went wrong')
      }
    })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn(menuButton, pending && 'opacity-50')} aria-label={`Actions for ${dishName}`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={editHref}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run(() => toggleMostPurchased(dishId), isMostPurchased ? 'Removed from popular' : 'Marked as popular')}>
            <Star className={cn('mr-2 h-4 w-4', isMostPurchased && 'fill-current')} />
            {isMostPurchased ? 'Remove popular' : 'Mark as popular'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{dishName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The dish, its photo, AR models and view history are removed from the menu. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => run(() => deleteDish(dishId), 'Dish deleted')}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface RestaurantRowMenuProps {
  restaurantId: string
  restaurantName: string
  role: 'admin' | 'manager'
  slug: string
}

export function RestaurantRowMenu({ restaurantId, restaurantName, role, slug }: RestaurantRowMenuProps) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const base = `/${role}/restaurants/${restaurantId}`

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn(menuButton, pending && 'opacity-50')} aria-label={`Actions for ${restaurantName}`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`${base}/menu` as Route}>Menu</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${base}/dishes` as Route}>Dishes</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${base}/edit` as Route}>Settings</Link>
          </DropdownMenuItem>
          {role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href={`${base}/users` as Route}>People</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={`/restaurant/${slug}`} target="_blank" rel="noopener noreferrer">
              Open public menu
            </a>
          </DropdownMenuItem>
          {role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{restaurantName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Every category, dish and QR code for this restaurant stops working. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteRestaurant(restaurantId)
                    router.refresh()
                    toast.success('Restaurant deleted')
                  } catch {
                    toast.error('Could not delete the restaurant')
                  }
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
