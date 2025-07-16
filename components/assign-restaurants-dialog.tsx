'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Restaurant {
  id: string
  name: string
}

export default function AssignRestaurantsDialog({
  userId,
  defaultRestaurantIds,
}: {
  userId: string
  defaultRestaurantIds: string[]
}) {
  const [open, setOpen] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selected, setSelected] = useState<string[]>(defaultRestaurantIds)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data: Restaurant[]) => setRestaurants(data))
  }, [open])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    await fetch(`/api/users/${userId}/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantIds: selected }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Restaurant</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Restaurants</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-60 overflow-auto">
          {restaurants.map((r) => (
            <label key={r.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(r.id)}
                onChange={() => toggle(r.id)}
                className="border"
              />
              <span>{r.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
