// components/orders/panel-back.tsx
// The way back from a panel that opened in place of a sheet's main view (a reason to pick, a
// table to move to): one thumb-sized "Back" and the panel's heading, so the sheet is one screen
// at a time and never a sheet on a sheet.
'use client'

import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** "Back" at the top of a panel, and the panel's heading under it. */
export function PanelBack({ title, onBack, busy }: { title: string; onBack: () => void; busy: boolean }) {
  return (
    <>
      <Button variant="ghost" className="-ml-2 h-12 gap-1 px-2 text-[15px]" onClick={onBack} disabled={busy}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </Button>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
    </>
  )
}
