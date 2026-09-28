// app/actions/printer-actions.ts
// The Printers section of Settings → Integrations: the restaurant's owner or a super admin acting
// for them (`requireRestaurantAccess`). A printer's address is answered once, by the action that
// made it (add, renew), and never read back.
'use server'

import { requireRestaurantAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { printerName, printTrigger, type PrintTriggerInput } from '@/lib/schemas/print'
import * as printers from '@/server/print/printers'

/** The owner or a super admin. Parses `printerName` and adds a printer; answers its secret, shown once. */
export async function addPrinter(rawRestaurantId: string, rawName: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return printers.addPrinter(restaurantId, printerName.parse(rawName))
}

/** The same people. Gives a printer a new address; the old one stops working. */
export async function renewPrinterAddress(rawRestaurantId: string, rawPrinterId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return printers.renewPrinterAddress(restaurantId, uuid.parse(rawPrinterId))
}

/** The same people. Removes a printer and what it still owed. */
export async function removePrinter(rawRestaurantId: string, rawPrinterId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return printers.removePrinter(restaurantId, uuid.parse(rawPrinterId))
}

/** The same people. Queues a test page on a printer. */
export async function printTestPage(rawRestaurantId: string, rawPrinterId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return printers.printTestPage(restaurantId, uuid.parse(rawPrinterId))
}

/** The same people. Parses `printTrigger` and sets when tickets print. */
export async function setPrintTrigger(rawRestaurantId: string, raw: PrintTriggerInput) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return printers.setPrintTrigger(restaurantId, printTrigger.parse(raw))
}
