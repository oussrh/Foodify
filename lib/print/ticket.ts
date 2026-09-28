// lib/print/ticket.ts
// What a piece of kitchen paper says, before any printer's language: a list of blocks (a banner,
// a title, the dishes, rules between them) laid out from the ticket as it stands. A printer
// driver turns the blocks into its own commands (lib/print/epos-xml.ts); the layout is decided
// once, here, and tested without a printer. No prices: the kitchen cooks, it does not bill.
import type { ChangeReason } from '@/lib/bill-rules'
import type { Locale } from '@/lib/menu'
import { PRINT_TEXT } from './print-text'

/** One block of a ticket, top to bottom. */
export type TicketBlock =
  /** Printed reversed across the paper: CANCEL, ADDITION TO #N. */
  | { type: 'banner'; text: string }
  /** Double size: the table and the number. */
  | { type: 'title'; text: string }
  | { type: 'text'; text: string; bold?: boolean }
  | { type: 'rule' }
  /** One dish: how many, its name, the guest's note under it. */
  | { type: 'item'; quantity: number; name: string; note: string | null }

/**
 * A ticket as blocks. No buzzer: on the current Epson models it is an external one, and an element
 * a printer does not take could fail the job; the paper coming out is the kitchen's signal.
 */
export type TicketDoc = { blocks: TicketBlock[] }

/** A dish as the ticket lists it, in the kitchen's language, with how many are still wanted. */
export type TicketItem = { quantity: number; name: string; note: string | null }

/** The ticket a job prints, read from its rows. */
export interface TicketSource {
  number: number
  table: string
  /** The number of the bill this ticket adds to, or null for a bill's first ticket. */
  parentNumber: number | null
  /** The waiter who sent it, or null for a guest's order from the QR menu. */
  placedBy: string | null
  note: string | null
  /** When the ticket was sent, on the restaurant's clock ("19:42"). */
  time: string
  items: TicketItem[]
}

/** The head every ticket and slip starts with: table and number, time and who sent it. */
function head(source: TicketSource, locale: Locale): TicketBlock[] {
  const text = PRINT_TEXT[locale]
  return [
    { type: 'title', text: `${text.table} ${source.table}  #${source.number}` },
    { type: 'text', text: `${source.time} · ${source.placedBy ? text.waiter(source.placedBy) : text.guest}` },
    { type: 'rule' },
  ]
}

/** The dishes, one item block each; a dish with nothing left to make is left out. */
function items(list: TicketItem[]): TicketBlock[] {
  return list.filter((item) => item.quantity > 0).map((item) => ({ type: 'item', ...item }))
}

/** A kitchen ticket: the dishes to cook for a table, an addition marked as such, the order's note at the foot. */
export function ticketDoc(source: TicketSource, locale: Locale): TicketDoc {
  const text = PRINT_TEXT[locale]
  const banner: TicketBlock[] = source.parentNumber === null ? [] : [{ type: 'banner', text: text.additionTo(source.parentNumber) }]
  const note: TicketBlock[] = source.note ? [{ type: 'rule' }, { type: 'text', text: `${text.note}: ${source.note}`, bold: true }] : []
  return { blocks: [...banner, ...head(source, locale), ...items(source.items), ...note] }
}

/** What a cancel slip stops: the whole ticket, or some of its dishes, and why. */
export type CancelScope = { whole: true; reason: ChangeReason | null } | { whole: false; items: TicketItem[]; reason: ChangeReason | null }

/** A cancel slip: under a CANCEL banner, what to stop on which ticket, and the reason when one was given. */
export function cancelDoc(source: TicketSource, scope: CancelScope, locale: Locale): TicketDoc {
  const text = PRINT_TEXT[locale]
  const what: TicketBlock[] = scope.whole
    ? [{ type: 'text', text: text.cancelWhole(source.number), bold: true }, ...items(source.items)]
    : [{ type: 'text', text: text.cancelSome(source.number), bold: true }, ...items(scope.items)]
  const reason: TicketBlock[] = scope.reason ? [{ type: 'rule' }, { type: 'text', text: text.reason[scope.reason] }] : []
  return { blocks: [{ type: 'banner', text: text.cancel }, ...head(source, locale), ...what, ...reason] }
}

/** A test page: the printer's name, and that tickets will print on it. */
export function testDoc(printer: string, time: string, locale: Locale): TicketDoc {
  const text = PRINT_TEXT[locale]
  return { blocks: [{ type: 'title', text: text.test }, { type: 'text', text: time }, { type: 'rule' }, { type: 'text', text: text.testBody(printer) }] }
}
