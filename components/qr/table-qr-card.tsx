// components/qr/table-qr-card.tsx
// One table's card: the code that goes on the table, and the two things you do with a single
// table rather than the whole room — print this one (a table added, a label torn) or copy its
// link (to put in a message, a tent card or a supplier's artwork).
//
// On paper it is the code and the table number, nothing else. What comes out of here is a
// working label, not artwork: a printer setting these properly takes the CSV or a copied link
// and sets the restaurant's name in the restaurant's own type. The number stays because that is
// the one thing that differs card to card and cannot be read off the code by eye.
'use client'

import Image from 'next/image'
import { Copy, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopy } from '@/components/shell/use-copy'
import { cn } from '@/lib/utils'
import { QR_SIZES, qrCodeUrl } from './qr-urls'
import { tableMenuUrl } from './table-qr'

interface TableQrCardProps {
  restaurantName: string
  slug: string
  origin: string
  table: number
  /** True while another table alone is being printed: this one is kept off that sheet. */
  excluded: boolean
  onPrint: () => void
}

/**
 * One table's QR card, encoding the menu link with its table number, with Print and Copy;
 * `excluded` hides it from paper while another table is printed alone.
 */
export default function TableQrCard({ restaurantName, slug, origin, table, excluded, onPrint }: TableQrCardProps) {
  const url = tableMenuUrl(origin, slug, table)
  const { copied, copy } = useCopy(`Table ${table} link`)

  return (
    <div
      className={cn(
        'flex break-inside-avoid flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center',
        excluded && 'print:hidden',
      )}
    >
      <Image
        src={qrCodeUrl(url, QR_SIZES.card)}
        alt={`QR code for table ${table} at ${restaurantName}`}
        width={180}
        height={180}
        className="h-auto w-full max-w-[180px]"
      />
      <p className="text-sm font-semibold print:hidden">{restaurantName}</p>
      <p className="tnum text-lg font-semibold leading-none">Table {table}</p>
      <p className="text-xs text-muted-foreground print:hidden">Scan for the menu</p>
      <div className="flex gap-1 print:hidden">
        <Button size="sm" variant="ghost" onClick={onPrint} aria-label={`Print the code for table ${table}`}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button size="sm" variant="ghost" onClick={() => copy(url)} aria-label={`Copy the link for table ${table}`}>
          <Copy className="h-4 w-4" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
