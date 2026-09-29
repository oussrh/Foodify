// components/pos/mapping-table.tsx
// One row per active dish: its name and price, the POS item it is rung up as (a list of the POS's
// items, or Not matched), and the suggestion when one was found and is not already chosen.
'use client'

import type { PosMenuItem } from '@/lib/pos/contract'
import type { MappingRow } from '@/lib/pos/mapping'

interface MappingTableProps {
  rows: MappingRow[]
  items: PosMenuItem[]
  /** The item chosen per dish id; '' is not matched. */
  chosen: Record<string, string>
  onChoose: (dishId: string, itemId: string) => void
  disabled: boolean
}

/** The dishes and a POS item picker for each. */
export function MappingTable({ rows, items, chosen, onChoose, disabled }: MappingTableProps) {
  const nameOf = new Map(items.map((item) => [item.id, `${item.name} · ${item.price}`]))
  return (
    <ul className="divide-y divide-border border-y border-border">
      {rows.map((row) => {
        const value = chosen[row.dishId] ?? ''
        const hint = row.suggestedItemId && row.suggestedItemId !== value ? nameOf.get(row.suggestedItemId) : undefined
        return (
          <li key={row.dishId} className="flex flex-col gap-2 px-5 py-3 md:flex-row md:items-center">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{row.name}</span>
              <span className="tnum block text-sm text-muted-foreground">
                {row.price}
                {hint ? ` · Suggested: ${hint}` : ''}
              </span>
            </span>
            <select
              aria-label={`POS item for ${row.name}`}
              className="h-12 w-full rounded-sm border border-input bg-card px-3 text-sm md:w-72"
              value={value}
              disabled={disabled}
              onChange={(event) => onChoose(row.dishId, event.target.value)}
            >
              <option value="">Not matched (sent as an open item)</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {nameOf.get(item.id)}
                </option>
              ))}
            </select>
          </li>
        )
      })}
    </ul>
  )
}
