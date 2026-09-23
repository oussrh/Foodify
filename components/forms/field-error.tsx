// components/forms/field-error.tsx
// The dot-and-sentence a create form shows under a field that failed validation; nothing when
// the field is fine.
import type { FieldError as FieldErrorShape } from "react-hook-form";

/** The dot-and-message under a field that failed validation; renders nothing when there is no error. */
export default function FieldError({ error }: { error?: FieldErrorShape | undefined }) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1">
      <span className="w-1 h-1 bg-destructive rounded-full"></span>
      {error.message}
    </p>
  );
}
