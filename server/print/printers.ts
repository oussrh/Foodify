// server/print/printers.ts
// The Printers section's writes: add a printer, give it a new address, remove it, print a test
// page, and choose when tickets print. Each is scoped by the restaurant the caller
// was guarded on, so a printer id from another restaurant changes nothing. A new address is
// answered once, here, and never stored (server/secret.ts).
import type { PrintTrigger } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { newSecret } from '@/server/secret'

/** What a write came to: done (with the new secret, when one was made), or the printer was not this restaurant's. */
export type PrinterOutcome = { ok: true; token?: string } | { ok: false; error: string }

const NOT_FOUND = { ok: false, error: 'That printer is no longer here. Refresh the page.' } as const

/** Adds a printer named `name` to `restaurantId`; answers its secret, to be shown once. */
export async function addPrinter(restaurantId: string, name: string): Promise<PrinterOutcome> {
  const { token, hash } = newSecret()
  await prisma.printer.create({ data: { restaurantId, name, tokenHash: hash }, select: { id: true } })
  return { ok: true, token }
}

/** Gives the printer a new secret: the old address stops working at once. */
export async function renewPrinterAddress(restaurantId: string, printerId: string): Promise<PrinterOutcome> {
  const { token, hash } = newSecret()
  const { count } = await prisma.printer.updateMany({ where: { id: printerId, restaurantId }, data: { tokenHash: hash, lastSeenAt: null, lastError: null } })
  return count === 1 ? { ok: true, token } : NOT_FOUND
}

/** Removes the printer and every job it still owed. */
export async function removePrinter(restaurantId: string, printerId: string): Promise<PrinterOutcome> {
  const { count } = await prisma.printer.deleteMany({ where: { id: printerId, restaurantId } })
  return count === 1 ? { ok: true } : NOT_FOUND
}

/** Queues a test page on the printer. */
export async function printTestPage(restaurantId: string, printerId: string): Promise<PrinterOutcome> {
  const printer = await prisma.printer.findFirst({ where: { id: printerId, restaurantId }, select: { id: true } })
  if (!printer) return NOT_FOUND
  await prisma.printJob.create({ data: { printerId: printer.id, kind: 'TEST' }, select: { id: true } })
  return { ok: true }
}

/** Sets when the restaurant's tickets print. */
export async function setPrintTrigger(restaurantId: string, trigger: PrintTrigger): Promise<PrinterOutcome> {
  await prisma.restaurant.update({ where: { id: restaurantId }, data: { printTrigger: trigger }, select: { id: true } })
  return { ok: true }
}
