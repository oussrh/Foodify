// components/qr/table-qr-sheet.tsx
// The printable sheet of per-table QR codes: one card per table, each carrying the menu link
// with its table number. Print is the browser's own dialog, and the print rules in globals.css
// drop the shell so only the cards go on paper; printing one table hides the others the same
// way, so a single card comes out rather than a page with one code and a lot of white.
'use client'

import { useEffect, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shell/page-header'
import TableCountDialog from './table-count-dialog'
import TableQrCard from './table-qr-card'
import { tableNumbers, tablesCsv } from './table-qr'

interface TableQrSheetProps {
  restaurantId: string
  restaurantName: string
  slug: string
  /** Absolute origin of the public menu, e.g. https://foodify.app */
  origin: string
  tableCount: number
}

export default function TableQrSheet({ restaurantId, restaurantName, slug, origin, tableCount }: TableQrSheetProps) {
  const tables = tableNumbers(tableCount)
  /**
   * The print asked for, or null between prints: `{ only: n }` for one table, `{ only: null }`
   * for the room. Both go through the same state so the dialog never opens before React has
   * hidden what should not be on the page — a button calling `print()` itself would race it.
   */
  const [request, setRequest] = useState<{ only: number | null } | null>(null)

  useEffect(() => {
    if (!request) return
    // Cleared when the dialog closes rather than straight after `print()`: the browser may still
    // be laying the page out, and clearing early puts the whole room back on the sheet.
    const done = () => setRequest(null)
    window.addEventListener('afterprint', done, { once: true })
    window.print()
    return () => window.removeEventListener('afterprint', done)
  }, [request])

  const exportCsv = () => {
    // A BOM so a spreadsheet opening it reads the name as UTF-8 rather than as its own codepage.
    const blob = new Blob(['﻿', tablesCsv({ name: restaurantName, slug }, origin, tableCount)], {
      type: 'text/csv;charset=utf-8',
    })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `${slug}-tables.csv`
    link.click()
    URL.revokeObjectURL(href)
  }

  if (tables.length === 0) {
    return (
      <EmptyState
        title="No tables set"
        description="Say how many tables the room has and a QR code for each one appears here, ready to print."
        action={
          <TableCountDialog
            restaurantId={restaurantId}
            tableCount={tableCount}
            trigger={<Button variant="outline">Set the number of tables</Button>}
          />
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4" data-print-sheet>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          {tables.length} table{tables.length === 1 ? '' : 's'}. Each code opens the menu with its table number already filled in.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TableCountDialog
            restaurantId={restaurantId}
            tableCount={tableCount}
            trigger={<Button variant="outline">Change tables</Button>}
          />
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setRequest({ only: null })}>
            <Printer className="h-4 w-4" />
            Print all
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
        {tables.map((table) => (
          <TableQrCard
            key={table}
            restaurantName={restaurantName}
            slug={slug}
            origin={origin}
            table={table}
            excluded={request?.only != null && request.only !== table}
            onPrint={() => setRequest({ only: table })}
          />
        ))}
      </div>
    </div>
  )
}
