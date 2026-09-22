// components/forms/form-dialog.tsx
// The short dialogs that hold three fields and one server action — adding a manager, setting a
// password. What each of them kept writing out was the same scaffolding: a busy flag, a failure
// line, a submit that stops the browser and closes on success. The fields are the caller's; the
// rest is here.
'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  /** False greys the submit; the caller decides what a filled-in form is. */
  canSubmit: boolean
  /** Resolving closes the dialog; throwing shows `failure` and leaves it open on what was typed. */
  onSubmit: () => Promise<void>
  /**
   * The one sentence shown when the action refuses. It has to cover every refusal: a server
   * action's own message does not survive to the browser in production.
   */
  failure: string
  /** The opener, when the dialog has one of its own; a row menu drives `open` instead. */
  trigger?: ReactNode
  children: ReactNode
}

/** A dialog whose body is a form: the caller's fields, and the submit and failure line below them. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  canSubmit,
  onSubmit,
  failure,
  trigger,
  children,
}: FormDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit()
      onOpenChange(false)
    } catch {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError('')
        onOpenChange(next)
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {children}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={busy || !canSubmit}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
