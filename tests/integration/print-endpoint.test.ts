import { describe, expect, it } from 'vitest'
import { place, posFloor } from './pos-fixtures'
import { POST } from '@/app/api/print/epson/[token]/route'
import { setOrderStatus } from '@/app/actions/order-actions'
import { addPrinter, printTestPage } from '@/server/print/printers'
import { withRollback, type Tx } from './db'
import { signInAs } from './session'

// An Epson printer's side of Server Direct Print, played against the route on the real database:
// it polls with its secret, is handed its jobs as ePOS-Print XML, and posts back what printed.

const NS = 'xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"'

/** One call of the printer whose secret is `token`. */
async function call(token: string, form: Record<string, string>) {
  const res = await POST(new Request(`http://test/api/print/epson/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() }), {
    params: Promise.resolve({ token }),
  })
  return { status: res.status, body: await res.text() }
}

const poll = (token: string) => call(token, { ConnectionType: 'GetRequest', ID: 'kitchen' })

/** The printer's result for job `jobId` (or for the whole answer, with null). */
function result(token: string, jobId: string | null, success: boolean, code = '') {
  const response = `<response ${NS} success="${success}" code="${code}" status="1"/>`
  const file = jobId === null ? `<PrintResponseInfo Version="1.00">${response}</PrintResponseInfo>` : `<PrintResponseInfo Version="2.00"><ePOSPrint><Parameter><printjobid>${jobId}</printjobid></Parameter><PrintResponse>${response}</PrintResponse></ePOSPrint></PrintResponseInfo>`
  return call(token, { ConnectionType: 'SetResponse', ID: 'kitchen', ResponseFile: file })
}

/** A restaurant taking orders with one printer; its secret. */
async function withPrinter(tx: Tx) {
  const floor = await posFloor(tx)
  const added = await addPrinter(floor.place.id, 'Pass')
  if (!added.ok || !added.token) throw new Error('no printer')
  return { ...floor, token: added.token }
}

const guestOrder = (restaurantId: string, dishId: string) => ({ restaurantId, table: '7', phone: '+212600112233', note: 'sans sel', lines: [{ dishId, quantity: 2 }] })
const jobOf = (tx: Tx, restaurantId: string) => tx.printJob.findFirstOrThrow({ where: { printer: { restaurantId } }, orderBy: { seq: 'desc' }, select: { seq: true, status: true, attempts: true, lastAnswer: true } })

describe('a printer asking for work', () => {
  it('is refused as unknown with a secret that names no printer', () =>
    withRollback(async () => {
      expect((await poll('A'.repeat(32))).status).toBe(404)
      expect((await poll('not-a-token')).status).toBe(404)
    }))

  it('gets an empty answer when nothing is owed, and is noted as seen', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant } = await withPrinter(tx)
      expect(await poll(token)).toEqual({ status: 200, body: '' })
      expect((await tx.printer.findFirstOrThrow({ where: { restaurantId: restaurant.id } })).lastSeenAt).not.toBeNull()
    }))

  it('is handed a new ticket once, as XML naming the job, the table, the dish and the note', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant, harira } = await withPrinter(tx)
      await place(guestOrder(restaurant.id, harira.id))
      const { seq } = await jobOf(tx, restaurant.id)
      const answer = await poll(token)
      expect(answer.status).toBe(200)
      expect(answer.body).toContain(`<printjobid>J${seq}</printjobid>`)
      expect(answer.body).toContain('TABLE 7')
      expect(answer.body).toContain('2 x Harira')
      expect(answer.body).toContain('sans sel')
      expect(await jobOf(tx, restaurant.id)).toMatchObject({ status: 'SENT', attempts: 0 })
      expect((await poll(token)).body).toBe('')
    }))

  it('is handed a cancel slip once the board cancels a printed ticket', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant, harira, kitchen } = await withPrinter(tx)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      await poll(token)
      signInAs(kitchen)
      await setOrderStatus({ orderId, action: 'cancel' })
      const answer = await poll(token)
      expect(answer.body).toMatch(/CANCEL|ANNULATION/)
      expect(answer.body).toContain('2 x Harira')
    }))

  it('is handed a test page', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant } = await withPrinter(tx)
      const printer = await tx.printer.findFirstOrThrow({ where: { restaurantId: restaurant.id }, select: { id: true } })
      await printTestPage(restaurant.id, printer.id)
      expect((await poll(token)).body).toMatch(/TEST PAGE|PAGE DE TEST/)
    }))
})

describe('a printer reporting back', () => {
  it('marks the job it names printed, and clears its last error', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant, harira } = await withPrinter(tx)
      await place(guestOrder(restaurant.id, harira.id))
      const { seq } = await jobOf(tx, restaurant.id)
      await poll(token)
      expect(await result(token, `J${seq}`, true)).toEqual({ status: 200, body: '' })
      expect(await jobOf(tx, restaurant.id)).toMatchObject({ status: 'PRINTED' })
      expect((await tx.printer.findFirstOrThrow({ where: { restaurantId: restaurant.id } })).lastError).toBeNull()
    }))

  it('puts a job back without spending an attempt when the printer is out of paper, and says so', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant, harira } = await withPrinter(tx)
      await place(guestOrder(restaurant.id, harira.id))
      await poll(token)
      await result(token, null, false, 'EPTR_REC_EMPTY')
      expect(await jobOf(tx, restaurant.id)).toMatchObject({ status: 'PENDING', attempts: 0, lastAnswer: 'Out of paper' })
      expect((await tx.printer.findFirstOrThrow({ where: { restaurantId: restaurant.id } })).lastError).toBe('Out of paper')
      expect((await poll(token)).body).toContain('Harira')
    }))

  it('hands a job out again, with an attempt spent, when its result never came', () =>
    withRollback(async (tx) => {
      const { token, place: restaurant, harira } = await withPrinter(tx)
      await place(guestOrder(restaurant.id, harira.id))
      await poll(token)
      await tx.printJob.updateMany({ where: { printer: { restaurantId: restaurant.id } }, data: { sentAt: new Date(Date.now() - 3 * 60_000) } })
      expect((await poll(token)).body).toContain('Harira')
      expect(await jobOf(tx, restaurant.id)).toMatchObject({ status: 'SENT', attempts: 1 })
    }))

  it('never touches another printer’s jobs', () =>
    withRollback(async (tx) => {
      const one = await withPrinter(tx)
      const other = await withPrinter(tx)
      await place(guestOrder(one.place.id, one.harira.id))
      expect((await poll(other.token)).body).toBe('')
      await poll(one.token)
      await result(other.token, null, true)
      expect(await jobOf(tx, one.place.id)).toMatchObject({ status: 'SENT' })
    }))
})
