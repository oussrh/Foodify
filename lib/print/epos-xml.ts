// lib/print/epos-xml.ts
// A ticket in Epson's language: ePOS-Print XML (ePOS-Print XML User's Manual, M00048231), wrapped
// in the envelope Server Direct Print answers a poll with (Server Direct Print User's Manual,
// M00062910, Version 2.00: each job carries its id, and the printer's result names it back). 80 mm
// paper, font A: 48 characters a line, 24 at double width. Sent as UTF-8 without a BOM, the only
// encoding the printer takes; the typographic quotes the app writes are made plain, since the
// printer's code page may not hold them.
import type { Locale } from '@/lib/menu'
import type { TicketBlock, TicketDoc } from './ticket'

/** Characters on one 80 mm line in font A. */
export const LINE_WIDTH = 48

const NAMESPACE = 'http://www.epson-pos.com/schemas/2011/03/epos-print'
/** How long the printer may take over one job before it gives up on it, in milliseconds. */
const JOB_TIMEOUT_MS = 10_000

/** `value` as XML text: on one line, the quotes a code page may lack made plain, the five specials escaped. */
function escape(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** One line of text in `style` (attributes), the style reset after it. */
function styled(text: string, style: Record<string, string>): string {
  const on = Object.entries(style).map(([key, value]) => ` ${key}="${value}"`).join('')
  const off = Object.keys(style).filter((key) => key !== 'align').map((key) => ` ${key}="false"`).join('')
  return `<text${on}>${escape(text)}&#10;</text><text${off}/>`
}

/** One block as ePOS-Print elements. */
function block(item: TicketBlock): string {
  switch (item.type) {
    case 'banner':
      return `<text align="center"/>${styled(` ${item.text} `, { reverse: 'true', em: 'true', dw: 'true', dh: 'true' })}<text align="left"/>`
    case 'title':
      return styled(item.text, { dw: 'true', dh: 'true', em: 'true' })
    case 'text':
      return item.bold ? styled(item.text, { em: 'true' }) : `<text>${escape(item.text)}&#10;</text>`
    case 'rule':
      return `<text>${'-'.repeat(LINE_WIDTH)}&#10;</text>`
    case 'item': {
      const dish = styled(`${item.quantity} x ${item.name}`, { dh: 'true', em: 'true' })
      return item.note ? `${dish}<text>    &gt; ${escape(item.note)}&#10;</text>` : dish
    }
  }
}

/** A ticket as one `<epos-print>` document: the language set first, the blocks, then a feed and a cut. */
export function eposDocument(doc: TicketDoc, locale: Locale): string {
  const body = doc.blocks.map(block).join('')
  return `<epos-print xmlns="${NAMESPACE}"><text lang="${locale}" smooth="true"/><text font="font_a"/>${body}<feed line="3"/><cut type="feed"/></epos-print>`
}

/** One job of an answer to a poll: its id, which the printer's result names back, and its document. */
export type EposJob = { id: string; document: string }

/** The answer to a poll with `jobs` in it, oldest first (Server Direct Print, Version 2.00). */
export function printRequest(jobs: EposJob[]): string {
  const each = jobs
    .map(
      (job) =>
        `<ePOSPrint><Parameter><devid>local_printer</devid><timeout>${JOB_TIMEOUT_MS}</timeout><printjobid>${escape(job.id)}</printjobid></Parameter><PrintData>${job.document}</PrintData></ePOSPrint>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="utf-8"?><PrintRequestInfo Version="2.00">${each}</PrintRequestInfo>`
}
