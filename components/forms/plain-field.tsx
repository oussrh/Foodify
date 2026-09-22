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
  min?: number
  max?: number
  /** One line under the field, for what a placeholder cannot say. */
  hint?: string
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
}: PlainFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
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
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
