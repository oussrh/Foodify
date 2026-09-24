// components/pos/mapping-card.tsx
// Matching the menu to the POS: the POS's items read now, a suggestion for every dish by name,
// "Map all suggested" to take them, Save to keep the matches, and Activate once the owner is done
// (a dish left unmatched is sent as an open item, flagged). Read again whenever it is opened.
'use client'

import { useEffect, useState } from 'react'
import { activatePos, readPosMenu, savePosMapping } from '@/app/actions/pos-mapping-actions'
import type { PosMenuItem } from '@/lib/pos/contract'
import type { MappingRow } from '@/lib/pos/mapping'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MappingTable } from './mapping-table'
import { usePosAction } from './use-pos-action'

type Menu = { items: PosMenuItem[]; rows: MappingRow[] }

/** The matching screen; `activate` shows the Activate button (the first time through), `onDone` a Done one (a review). */
export function MappingCard({ restaurantId, activate, onDone }: { restaurantId: string; activate: boolean; onDone?: () => void }) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [problem, setProblem] = useState('')
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const { busy, run } = usePosAction()

  useEffect(() => {
    let live = true
    readPosMenu(restaurantId)
      .then((answer) => {
        if (!live) return
        if (!answer.ok) return setProblem(answer.error)
        setMenu(answer)
        setChosen(Object.fromEntries(answer.rows.map((row) => [row.dishId, row.currentItemId ?? ''])))
      })
      .catch(() => live && setProblem('Could not read the POS menu. Try again.'))
    return () => {
      live = false
    }
  }, [restaurantId])

  const suggested = () => setChosen((now) => ({ ...now, ...Object.fromEntries((menu?.rows ?? []).filter((row) => row.suggestedItemId && !now[row.dishId]).map((row) => [row.dishId, row.suggestedItemId ?? ''])) }))
  const matches = () => savePosMapping(restaurantId, { items: Object.entries(chosen).map(([dishId, itemId]) => ({ dishId, externalItemId: itemId || null })) })
  // Activating keeps what is on the screen first: a match chosen and not saved would otherwise be lost.
  const saveAndActivate = async () => {
    const saved = await matches()
    return saved.ok ? activatePos(restaurantId) : saved
  }
  const matched = Object.values(chosen).filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match your dishes</CardTitle>
        <CardDescription>Each dish is rung up as the POS item you choose. Suggestions are made on the names; check them before you save.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pb-5">
        {problem && <p className="px-5 text-sm text-destructive">{problem}</p>}
        {!problem && !menu && <p className="px-5 text-sm text-muted-foreground">Reading the POS menu…</p>}
        {menu && menu.rows.length === 0 && <p className="px-5 text-sm text-muted-foreground">This restaurant has no active dishes yet.</p>}
        {menu && menu.rows.length > 0 && <MappingTable rows={menu.rows} items={menu.items} chosen={chosen} onChoose={(dishId, itemId) => setChosen((now) => ({ ...now, [dishId]: itemId }))} disabled={busy} />}
        {menu && (
          <div className="flex flex-wrap items-center gap-2 px-5">
            <span className="tnum mr-auto text-sm text-muted-foreground">
              {matched} of {menu.rows.length} matched
            </span>
            <Button type="button" variant="outline" className="h-12" disabled={busy} onClick={suggested}>
              Map all suggested
            </Button>
            <Button type="button" className="h-12" disabled={busy} onClick={() => void run(matches, 'Matches saved')}>
              Save matches
            </Button>
            {activate && (
              <Button type="button" className="h-12" disabled={busy} onClick={() => void run(saveAndActivate, 'Sending to your POS')}>
                Save and activate
              </Button>
            )}
            {onDone && (
              <Button type="button" variant="ghost" className="h-12" disabled={busy} onClick={onDone}>
                Done
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
