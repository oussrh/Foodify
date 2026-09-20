'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { call } from '@/lib/api-client'
import { toast } from 'sonner'

export default function RemoveUserRestaurantButton({
  userId,
  restaurantIds,
  restaurantId,
}: {
  userId: string
  restaurantIds: string[]
  restaurantId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)
    try {
      await call(  `/api/users/${userId}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantIds: restaurantIds.filter((id: string) => id !== restaurantId),
        }),
      })
      router.refresh()
    } catch {
      toast.error('Could not remove the restaurant')
    } finally {
      setLoading(false)
    }
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
