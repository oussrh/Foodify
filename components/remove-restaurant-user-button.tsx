'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveRestaurantUserButton({
  restaurantId,
  userIds,
  userId,
}: {
  restaurantId: string
  userIds: string[]
  userId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)
    await fetch(`/api/restaurants/${restaurantId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: userIds.filter((id: string) => id !== userId),
      }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <span
      onClick={handleRemove}
      className={`flex items-center gap-2 w-full ${
        loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
      }`}
    >
      Remove
    </span>
  )
}
