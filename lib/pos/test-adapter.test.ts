import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import type { PosTicket } from './contract'
import { createTestAdapter, testPosSignature } from './test-adapter'

const adapter = (apiKey: string, attempt = 1) => createTestAdapter({ credentials: { apiKey }, locationId: 'tpos-dining-room', attempt })
const bill = { id: 'o-1', number: 7, table: '4', externalId: null }
const ticket: PosTicket = {
  idempotencyKey: 'row-1',
  id: 'o-1',
  number: 7,
  table: '4',
  note: null,
  currency: 'EUR',
  subtotal: '9.00',
  placedAt: '2026-09-25T10:00:00.000Z',
  lines: [
    { lineId: 'l-1', name: 'Harira', quantity: 1, unitPrice: '4.50', note: null, externalItemId: 'tpos-item-harira' },
    { lineId: 'l-2', name: 'Special', quantity: 1, unitPrice: '4.50', note: null, externalItemId: null },
  ],
}

describe('the Test POS', () => {
  it('signs in with a test_ key, naming an account and two locations', async () => {
    const answer = await adapter('test_demo').connect({ apiKey: 'test_demo' })
    expect(answer).toMatchObject({ kind: 'ok', locations: [{ id: 'tpos-dining-room', name: 'Dining room' }, { id: 'tpos-terrace', name: 'Terrace' }] })
    expect(answer.kind === 'ok' && answer.accountId).toMatch(/^tpos-account-[0-9a-f]{8}$/)
  })

  it('refuses a key that is not a test key, a test_bad key, and a missing one', async () => {
    for (const apiKey of ['live_123', 'test_bad_key']) expect((await adapter(apiKey).connect({ apiKey })).kind).toBe('refused')
    expect((await adapter('x').connect({})).kind).toBe('refused')
  })

  it('answers a test, and reads its menu with prices as decimal strings', async () => {
    expect(await adapter('test_demo').test()).toEqual({ kind: 'ok', note: 'The Test POS answered' })
    const menu = await adapter('test_demo').readMenu()
    expect(menu.kind === 'ok' && menu.items.find((item) => item.name === 'Harira')).toEqual({ id: 'tpos-item-harira', name: 'Harira', price: '4.50' })
  })

  it('takes a ticket with an id derived from ours, and says an unmatched line was kept as an open item', async () => {
    expect(await adapter('test_demo').sendTicket(bill, ticket)).toEqual({
      kind: 'ok',
      externalId: 'tpos-ticket-o-1',
      note: 'Received ticket #7 for table 4 (opening its bill): 2 lines, 1 unmatched kept as open items',
    })
    const addition = { ...ticket, id: 'o-2', number: 8, lines: [ticket.lines[0]].filter((line) => line !== undefined) }
    expect(await adapter('test_demo').sendTicket(bill, addition)).toMatchObject({ externalId: 'tpos-ticket-o-2', note: 'Received ticket #8 for table 4 (on bill #7): 1 lines' })
  })

  it('takes a change and a close', async () => {
    const change = { idempotencyKey: 'row-2', ticketId: 'o-1', ticketExternalId: 'tpos-ticket-o-1', kind: 'REMOVE' as const, lineId: 'l-1', externalItemId: null, quantity: 1, reason: 'mistake' }
    expect(await adapter('test_demo').changeTicket(change)).toEqual({ kind: 'ok', externalId: 'tpos-change-row-2', note: 'Received a remove on tpos-ticket-o-1' })
    expect(await adapter('test_demo').changeTicket({ ...change, ticketExternalId: null })).toMatchObject({ note: 'Received a remove on a ticket it never had' })
    const close = { idempotencyKey: 'row-3', billId: 'o-1', externalId: 'tpos-ticket-o-1', total: '9.00', closedAt: '2026-09-25T11:00:00.000Z' }
    expect(await adapter('test_demo').closeBill?.(close)).toEqual({ kind: 'ok', externalId: 'tpos-close-o-1', note: 'Closed tpos-ticket-o-1 at 9.00' })
    expect(await adapter('test_demo').closeBill?.({ ...close, externalId: null })).toMatchObject({ note: 'Closed a bill it never had at 9.00' })
  })

  it('refuses every write under a test_refuse key', async () => {
    expect(await adapter('test_refuse').sendTicket(bill, ticket)).toEqual({ kind: 'refused', reason: 'The Test POS refused it (the key asks for refusals)' })
  })

  it('asks for a retry on every attempt under test_retry, and on the first N under test_retryN', async () => {
    expect((await adapter('test_retry', 9).sendTicket(bill, ticket)).kind).toBe('retry')
    expect((await adapter('test_retry2', 2).sendTicket(bill, ticket)).kind).toBe('retry')
    expect((await adapter('test_retry2', 3).sendTicket(bill, ticket)).kind).toBe('ok')
  })

  describe('its webhooks', () => {
    const receivedAt = new Date('2026-09-25T10:00:00.000Z')
    const ts = String(receivedAt.getTime() / 1000)
    const parse = adapter('test_demo').parseWebhook
    /** A webhook as the Test POS signs it under `key`, at `timestamp`. */
    const signed = (body: string, key = 'test_demo', timestamp = ts) => ({ headers: { 'x-test-pos-signature': testPosSignature(key, timestamp, body), 'x-test-pos-timestamp': timestamp }, body, receivedAt })
    const paid = JSON.stringify({ id: 'ev-1', type: 'PAID', location: 'tpos-dining-room', bill: 'tpos-ticket-o-1' })

    it('reads an event signed with its key over the timestamp and the body', async () => {
      expect(testPosSignature('test_demo', ts, paid)).toBe(createHmac('sha256', 'test_demo').update(`${ts}.${paid}`).digest('hex'))
      expect(await parse?.(signed(paid))).toEqual({ kind: 'ok', event: { id: 'ev-1', kind: 'PAID', locationId: 'tpos-dining-room', billExternalId: 'tpos-ticket-o-1', itemExternalId: null } })
      const item = JSON.stringify({ id: 'ev-3', type: 'ITEM_UNAVAILABLE', location: 'tpos-terrace', item: 'tpos-item-harira' })
      expect(await parse?.(signed(item))).toMatchObject({ event: { billExternalId: null, itemExternalId: 'tpos-item-harira' } })
    })

    it('refuses a bad signature, a missing one, and a signature whose timestamp was changed', async () => {
      expect((await parse?.({ ...signed(paid), headers: { 'x-test-pos-signature': 'f'.repeat(64), 'x-test-pos-timestamp': ts } }))?.kind).toBe('refused')
      expect((await parse?.({ headers: {}, body: paid, receivedAt }))?.kind).toBe('refused')
      const moved = signed(paid)
      expect((await parse?.({ ...moved, headers: { ...moved.headers, 'x-test-pos-timestamp': String(Number(ts) + 1) } }))?.kind).toBe('refused')
    })

    it('refuses an event signed more than five minutes before it arrives, or after', async () => {
      expect(await parse?.(signed(paid, 'test_demo', String(Number(ts) - 301)))).toEqual({ kind: 'refused', reason: 'The event is too old, or from the future' })
      expect((await parse?.(signed(paid, 'test_demo', String(Number(ts) + 301))))?.kind).toBe('refused')
      expect((await parse?.(signed(paid, 'test_demo', String(Number(ts) - 299))))?.kind).toBe('ok')
    })

    it('refuses a body that is not JSON, or not one of its events', async () => {
      expect(await parse?.(signed('not json'))).toEqual({ kind: 'refused', reason: 'The body is not JSON' })
      expect(await parse?.(signed(JSON.stringify({ id: 'ev-2', type: 'REFUND', location: 'x' })))).toEqual({ kind: 'refused', reason: 'The event is not one the Test POS sends' })
    })

    it('made without a key, verifies none', async () => {
      const keyless = createTestAdapter({ credentials: {}, locationId: null, attempt: 1 })
      expect((await keyless.sendTicket(bill, ticket)).kind).toBe('ok')
      expect((await keyless.parseWebhook?.(signed('{}')))?.kind).toBe('refused')
    })
  })

  it('describes itself', () => {
    expect(adapter('test_demo').describe()).toEqual({ key: 'test-pos', name: 'Test POS', auth: 'api_key', closesBills: true, webhooks: true })
  })
})
