'use client'

import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

type Restaurant = { id: string; name: string }

export default function AdminHeader({ restaurants }: { restaurants: Restaurant[] }) {
  const [selected, setSelected] = useState('')

  useEffect(() => {
    if (!selected && restaurants.length) {
      const stored = localStorage.getItem('currentRestaurant')
      setSelected(stored || restaurants[0].id)
    }
  }, [restaurants, selected])

  useEffect(() => {
    if (selected) localStorage.setItem('currentRestaurant', selected)
  }, [selected])

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <h1 className="text-lg font-bold">Foodify Admin</h1>
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <ThemeToggle />
      </div>
    </header>
  )
}
