// components/print/printer-row.tsx
// One printer in the Printers section: its name, whether it is asking for work, what it still
// owes and its last trouble, and its three actions: a test page, a new address (the old one stops
// working, for a printer that was reset or an address that leaked) and removal behind a confirmation.
'use client'

import { printTestPage, removePrinter, renewPrinterAddress } from '@/app/actions/printer-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePosAction } from '@/components/pos/use-pos-action'
import { printerOnline, type PrinterView } from '@/lib/print/view'

/** Online, offline, or not set up yet (it never asked). */
function StateBadge({ lastSeenAt }: { lastSeenAt: string | null }) {
  if (lastSeenAt === null) return <Badge variant="outline">Not set up</Badge>
  return printerOnline(lastSeenAt) ? <Badge variant="success">Online</Badge> : <Badge variant="warning">Offline</Badge>
}

/** What it still owes, and its last trouble, in one line. */
function Health({ printer }: { printer: PrinterView }) {
  const parts = [printer.waiting > 0 ? `${printer.waiting} waiting` : 'Nothing waiting', printer.failed > 0 ? `${printer.failed} failed` : null, printer.lastError].filter(Boolean)
  return <p className="text-xs text-muted-foreground">{parts.join(' · ')}</p>
}

/** Remove, asking first. */
function RemoveButton({ restaurantId, printer }: { restaurantId: string; printer: PrinterView }) {
  const { busy, run } = usePosAction()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-12 text-destructive" disabled={busy}>
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {printer.name}?</AlertDialogTitle>
          <AlertDialogDescription>It stops printing at once, and whatever it had not printed yet is dropped. You can add it again later; it will get a new address.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12">Keep it</AlertDialogCancel>
          <AlertDialogAction className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void run(() => removePrinter(restaurantId, printer.id), `${printer.name} removed`)}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** One printer; `onAddress` receives a new address to reveal once. */
export function PrinterRow({ restaurantId, printer, onAddress }: { restaurantId: string; printer: PrinterView; onAddress: (name: string, token: string) => void }) {
  const { busy, run } = usePosAction()

  const renew = async () => {
    const outcome = await run(() => renewPrinterAddress(restaurantId, printer.id))
    if (outcome?.ok && outcome.token) onAddress(printer.name, outcome.token)
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{printer.name}</span>
        <StateBadge lastSeenAt={printer.lastSeenAt} />
      </div>
      <Health printer={printer} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => printTestPage(restaurantId, printer.id), 'Test page sent to the printer')}>
          Test page
        </Button>
        <Button variant="ghost" className="h-12" disabled={busy} onClick={() => void renew()}>
          New address
        </Button>
        <RemoveButton restaurantId={restaurantId} printer={printer} />
      </div>
    </li>
  )
}
