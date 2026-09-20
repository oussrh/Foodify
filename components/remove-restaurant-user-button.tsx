'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { call } from '@/lib/api-client'

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
    await call(`/api/restaurants/${restaurantId}/users`, {
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
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="flex items-center gap-2 w-full text-left disabled:opacity-50"
    >
      Remove
    </button>
  )
}
