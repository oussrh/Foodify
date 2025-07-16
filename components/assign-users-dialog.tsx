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
import { Label } from '@/components/ui/label'

interface User {
  id: string
  email: string
}

export default function AssignUsersDialog({
  restaurantId,
  defaultUserIds,
}: {
  restaurantId: string
  defaultUserIds: string[]
}) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<string[]>(defaultUserIds)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    fetch('/api/users?role=RESTAURANT_ADMIN')
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data))
  }, [open])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    await fetch(`/api/restaurants/${restaurantId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selected }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Users</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-60 overflow-auto">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="border"
              />
              <span>{u.email}</span>
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
