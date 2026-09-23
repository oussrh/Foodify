// components/menu/cart/line-note.tsx
// What the guest asks for on one dish ("no onions"): a quiet button under the line that opens a
// field, and the note itself once there is one. One note per dish, not per portion. The note is
// stored as it is typed, so nothing is lost if the sheet is closed.
'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { MAX_NOTE } from '@/lib/cart'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'

interface LineNoteProps {
  /** The dish this note is about, for the field's label. */
  name: string
  note: string
  onNote: (note: string) => void
  locale: Locale
  /** A distinct id per line: the field and its label are paired with it. */
  fieldId: string
}

/**
 * What the guest asks for on one dish ("no onions"): a quiet button that opens a field, stored as
 * typed. One note per dish, not per portion.
 */
export default function LineNote({ name, note, onNote, locale, fieldId }: LineNoteProps) {
  const t = MENU_TEXT[locale]
  const [open, setOpen] = useState(false)
  // The guest asked for the field, so the caret goes into it; autoFocus would grab it on render.
  const fieldRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) fieldRef.current?.focus()
  }, [open])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-left text-[13px] text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {note ? <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <span className="truncate">{note || t.addNote}</span>
        <span className="sr-only">{t.noteFor(name)}</span>
      </button>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={fieldId} className="block text-[13px] text-muted-foreground">
          {t.noteFor(name)}
        </label>
        <input
          id={fieldId}
          ref={fieldRef}
          type="text"
          value={note}
          maxLength={MAX_NOTE}
          placeholder={t.notePlaceholder}
          onChange={(e) => onNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setOpen(false)
          }}
          className="mt-1 h-11 w-full rounded-md border border-input bg-card px-3 text-[15px] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-[13px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.saveNote}
      </button>
    </div>
  )
}
