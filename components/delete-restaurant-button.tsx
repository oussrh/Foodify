'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteRestaurant } from '@/app/actions/restaurant-actions'

export default function DeleteRestaurantButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await deleteRestaurant(id)
    setLoading(false)
    // refresh the page to show updated list
    window.location.reload()
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={loading}>
      Delete
    </Button>
  )
}
