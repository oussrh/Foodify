// components/forms/plain-field.tsx
// A labelled input for the short forms that are not React Hook Form: adding a manager, naming a
// tablet, setting a device's password. Those forms are three fields long and hold their own
// state; what they kept repeating was the label, the input and the line of help under it.
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PlainFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** `text` even for a password here: these are read aloud or copied onto a device as they are typed. */
  type?: 'text' | 'email' | 'number'
  autoComplete?: string
  required?: boolean
  /** `number` only; the same bounds the schema parses with, so the browser refuses first. */
  min?: number | undefined
  max?: number | undefined
  /** One line under the field, for what a placeholder cannot say. */
  hint?: string
  /** Controls beside the input, on the same line (a password's Generate and Copy). */
  action?: React.ReactNode
  /** The schema's message for this field, shown under it and marking it invalid; '' or absent when it is fine. */
  error?: string | undefined
}

/** Label, input and optional hint, tied together by id. */
export function PlainField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete = 'off',
  required,
  min,
  max,
  hint,
  action,
  error,
}: PlainFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          inputMode={type === 'number' ? 'numeric' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {action}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
