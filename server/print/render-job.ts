// server/print/render-job.ts
// A job as the paper it prints, read from the rows as they stand when the printer asks: the ticket
// with the dishes still wanted, a cancel slip with what to stop, a test page. In the restaurant's
// default language and on its clock. The layout is lib/print/ticket.ts; the XML lib/print/epos-xml.ts.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { effectiveQuantity } from '@/lib/orders'
import { eposDocument, type EposJob } from '@/lib/print/epos-xml'
import { cancelDoc, testDoc, ticketDoc, type TicketDoc, type TicketItem, type TicketSource } from '@/lib/print/ticket'
import type { Locale } from '@/lib/menu'

const JOB_SELECT = {
  id: true,
  seq: true,
  kind: true,
  createdAt: true,
  printer: { select: { name: true, restaurant: { select: { defaultLocale: true, timeZone: true } } } },
  change: { select: { lineId: true, quantity: true, reason: true } },
  order: {
    select: {
      number: true,
      table: true,
      note: true,
      createdAt: true,
      parent: { select: { number: true } },
      placedBy: { select: { username: true } },
      lines: { select: { id: true, nameEn: true, nameFr: true, quantity: true, removedQuantity: true, note: true } },
    },
  },
} satisfies Prisma.PrintJobSelect

type JobRow = Prisma.PrintJobGetPayload<{ select: typeof JOB_SELECT }>
type OrderRow = NonNullable<JobRow['order']>

/** The id a job goes by on the printer: short, and read back from its result. */
export function printJobId(seq: number): string {
  return `J${seq}`
}

/** "19:42" on the restaurant's clock. */
function clock(at: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(at)
}

/** The ticket's facts, its dishes counted by `quantity`. */
function sourceOf(order: OrderRow, time: string, locale: Locale, quantity: (line: OrderRow['lines'][number]) => number): TicketSource {
  const items: TicketItem[] = order.lines.map((line) => ({ quantity: quantity(line), name: locale === 'fr' ? line.nameFr : line.nameEn, note: line.note }))
  return { number: order.number, table: order.table, parentNumber: order.parent?.number ?? null, placedBy: order.placedBy?.username ?? null, note: order.note, time, items }
}

/**
 * A cancel slip. A whole ticket (no change row, or one without a line) lists every dish as it was
 * asked for, since the cancel has just taken them all off; a removal lists the one dish and how many.
 */
function cancelOf(job: JobRow, order: OrderRow, locale: Locale, time: string): TicketDoc {
  const reason = job.change?.reason ?? null
  const lineId = job.change?.lineId ?? null
  if (lineId === null) return cancelDoc(sourceOf(order, time, locale, (line) => line.quantity), { whole: true, reason }, locale)
  const source = sourceOf(order, time, locale, effectiveQuantity)
  const line = order.lines.find((candidate) => candidate.id === lineId)
  const items = line ? [{ quantity: job.change?.quantity ?? 1, name: locale === 'fr' ? line.nameFr : line.nameEn, note: null }] : []
  return cancelDoc(source, { whole: false, items, reason }, locale)
}

/** One job as its document. */
function docOf(job: JobRow): TicketDoc {
  const { defaultLocale: locale, timeZone } = job.printer.restaurant
  if (job.kind === 'TEST' || !job.order) return testDoc(job.printer.name, clock(job.createdAt, timeZone, locale), locale)
  if (job.kind === 'CANCEL') return cancelOf(job, job.order, locale, clock(job.createdAt, timeZone, locale))
  return ticketDoc(sourceOf(job.order, clock(job.order.createdAt, timeZone, locale), locale, effectiveQuantity), locale)
}

/** The jobs `ids` as the printer is handed them, oldest first. */
export async function renderJobs(ids: string[]): Promise<EposJob[]> {
  const jobs = await prisma.printJob.findMany({ where: { id: { in: ids } }, orderBy: { seq: 'asc' }, select: JOB_SELECT })
  return jobs.map((job) => ({ id: printJobId(job.seq), document: eposDocument(docOf(job), job.printer.restaurant.defaultLocale) }))
}
