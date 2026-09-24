// components/admin/add-manager-dialog.tsx
// Adding a manager to one restaurant, by address. There is no list to pick from on purpose: the
// candidates would be every manager on the platform, and one restaurant has no business reading
// another's. An address that already manages somewhere joins with the password it has; a new one
// is created with the password typed here.
'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addRestaurantManager } from '@/app/actions/restaurant-manager-actions'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/forms/form-dialog'
import { PlainField } from '@/components/forms/plain-field'
import { PasswordTools } from '@/components/forms/password-tools'
import { fieldIssues } from '@/components/forms/schema-check'
import { restaurantManager } from '@/lib/schemas/user'

/** The People tab's "Add manager": an address, and a password used only if that address is new here. */
export default function AddManagerDialog({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const field = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})

  const add = async () => {
    // The action's own schema, so a bad address or a short password is named on its field before the request.
    const input = { email: email.trim(), password: password || undefined }
    const found = fieldIssues(restaurantManager, input)
    setIssues(found)
    if (Object.keys(found).length > 0) return false
    await addRestaurantManager(restaurantId, input)
    setEmail('')
    setPassword('')
    router.refresh()
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Add a manager"
      description="They will be able to edit this restaurant's menu, dishes and settings, and to manage its tablets and waiters."
      submitLabel="Add manager"
      canSubmit={email.trim().length > 0}
      onSubmit={add}
      failure="Could not add that manager. Check the address, and give a password if the account is new here."
      trigger={<Button>Add manager</Button>}
    >
      <PlainField
        id={`${field}-email`}
        label="Email address"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        placeholder="name@restaurant.com"
        required
        error={issues.email}
      />
      <PlainField
        id={`${field}-password`}
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="At least 6 characters"
        hint="Only needed if this address is new to Foodify. Someone who already has an account keeps their own password. Generate makes a strong one to copy and hand over."
        action={<PasswordTools value={password} onChange={setPassword} />}
        error={issues.password}
      />
    </FormDialog>
  )
}
