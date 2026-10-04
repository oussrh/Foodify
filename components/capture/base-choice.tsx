// components/capture/base-choice.tsx
// What goes on the model's underside, which the camera never sees: the restaurant's logo, its name,
// or a plain plate. The logo is offered only when the engine can read it (PNG, JPEG, or an image on
// Cloudinary); otherwise the name is the default.
'use client'

import type { CaptureBase } from '@/lib/capture'

type Props = {
  name: string
  value: CaptureBase
  onChange: (value: CaptureBase) => void
  hasLogo: boolean
  restaurantName: string
}

/** Three radio options in a fieldset. */
export function BaseChoice({ name, value, onChange, hasLogo, restaurantName }: Props) {
  const options: { value: CaptureBase; label: string; disabled?: boolean }[] = [
    { value: 'LOGO', label: hasLogo ? 'Your logo' : 'Your logo (add one in Settings → Branding)', disabled: !hasLogo },
    { value: 'NAME', label: `The name, “${restaurantName}”` },
    { value: 'PLAIN', label: 'Plain, in the plate’s colour' },
  ]
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Under the plate</legend>
      <p className="text-sm text-muted-foreground">The camera never sees the bottom, so it is made: shown when a guest turns the dish over in 3D.</p>
      {options.map((option) => (
        <label key={option.value} className="flex min-h-11 items-center gap-3 rounded-sm border px-3 text-sm has-[:checked]:border-primary has-[:disabled]:opacity-60">
          <input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onChange(option.value)} className="h-4 w-4 accent-primary" />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
