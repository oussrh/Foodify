// components/print/printers-panel.tsx
// Settings → Integrations, the kitchen printers, as both portals show it: when a ticket prints,
// the printers with their health, and adding one. The page reads the view (server/print/view.ts)
// and every action refreshes it; a new address is held here only until it is dismissed.
'use client'

import { useState } from 'react'
import type { PrintView } from '@/lib/print/view'
import { AddPrinterForm } from './add-printer-form'
import { AddressReveal } from './address-reveal'
import { PrinterRow } from './printer-row'
import { TriggerChoice } from './trigger-choice'

/** The Integrations tab's Printers section. */
export function PrintersPanel({ view }: { view: PrintView }) {
  const [revealed, setRevealed] = useState<{ name: string; token: string } | null>(null)
  const reveal = (name: string, token: string) => setRevealed({ name, token })

  return (
    <section aria-labelledby="printers-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="printers-heading" className="text-lg font-semibold">
          Kitchen printers
        </h2>
        <p className="text-sm text-muted-foreground">Print every ticket in the kitchen: the dishes, the table and the notes. A cancelled ticket or a removed dish prints a cancel slip.</p>
      </div>
      <TriggerChoice restaurantId={view.restaurantId} trigger={view.trigger} />
      {revealed && <AddressReveal name={revealed.name} token={revealed.token} onDone={() => setRevealed(null)} />}
      {view.printers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {view.printers.map((printer) => (
            <PrinterRow key={printer.id} restaurantId={view.restaurantId} printer={printer} onAddress={reveal} />
          ))}
        </ul>
      )}
      <AddPrinterForm restaurantId={view.restaurantId} onAdded={reveal} />
    </section>
  )
}
