// components/forms/schema-check.ts
// The forms that are not React Hook Form check with the same schema their action parses: these
// read a parse as what a field shows (its own message) or what a toast says (the first issue),
// so no form writes out a rule of its own.
import { toast } from 'sonner'
import type { z } from 'zod'
import { firstIssue } from '@/lib/schemas/common'

/** The first message of each top-level field of a failed parse, keyed by the field; empty when the value parses. */
export function fieldIssues(schema: z.ZodType, value: unknown): Record<string, string> {
  const parsed = schema.safeParse(value)
  if (parsed.success) return {}
  const issues: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '')
    issues[key] ??= issue.message
  }
  return issues
}

/** The message of a failed parse's first issue, '' when the value parses: a single field's own line. */
export function issueOf(schema: z.ZodType, value: unknown): string {
  const parsed = schema.safeParse(value)
  return parsed.success ? '' : firstIssue(parsed.error)
}

/** The parsed value, or null after a toast of the first issue: for a form whose fields have no line of their own. */
export function parsedOrToast<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  toast.error(firstIssue(parsed.error))
  return null
}

/**
 * "<label>: <message>" for the first field of a react-hook-form error map that carries a message,
 * null when none does: what a refused save toasts, so a field with no line of its own (a hidden
 * input, a picker) still says why. The label is `labels`' own, else the field's name.
 */
export function firstFieldError(errors: Record<string, unknown>, labels: Readonly<Record<string, string>> = {}): string | null {
  for (const [field, error] of Object.entries(errors)) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined
    if (typeof message === 'string' && message) return `${labels[field] ?? field}: ${message}`
  }
  return null
}
