import { describe, expect, it } from 'vitest'
import { billClose, billMerge, billMove, billUnmerge, changeLogQuery, changeReason, lineChange, requestDecision, ticketChange } from './order-changes'

const A = '8f0f3d6a-1d3f-4a1b-9c2e-000000000001'
const B = '8f0f3d6a-1d3f-4a1b-9c2e-000000000002'

describe('changeReason', () => {
  it('takes a reason from the list with no note', () => {
    expect(changeReason.safeParse({ reason: 'changed_mind' }).success).toBe(true)
  })

  it('refuses a reason off the list', () => {
    expect(changeReason.safeParse({ reason: 'because' }).success).toBe(false)
  })

  it('refuses other without a note, pointing at the note', () => {
    const parsed = changeReason.safeParse({ reason: 'other', note: '  ' })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.path).toEqual(['note'])
  })

  it('takes other with a note, trimmed, and refuses a note over 200 characters', () => {
    expect(changeReason.parse({ reason: 'other', note: '  Allergy  ' }).note).toBe('Allergy')
    expect(changeReason.safeParse({ reason: 'mistake', note: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('ticketChange and lineChange', () => {
  it('take a ticket, or a line and a whole quantity from one', () => {
    expect(ticketChange.parse({ orderId: A, reason: 'too_slow' })).toEqual({ orderId: A, reason: 'too_slow' })
    expect(lineChange.parse({ lineId: A, quantity: 2, reason: 'mistake' })).toMatchObject({ lineId: A, quantity: 2 })
  })

  it('refuse a quantity of zero, a fraction and an id that is not one', () => {
    expect(lineChange.safeParse({ lineId: A, quantity: 0, reason: 'mistake' }).success).toBe(false)
    expect(lineChange.safeParse({ lineId: A, quantity: 1.5, reason: 'mistake' }).success).toBe(false)
    expect(ticketChange.safeParse({ orderId: 'o1', reason: 'mistake' }).success).toBe(false)
  })

  it('hold the note rule for other', () => {
    expect(ticketChange.safeParse({ orderId: A, reason: 'other' }).success).toBe(false)
    expect(lineChange.safeParse({ lineId: A, quantity: 1, reason: 'other', note: 'Spilt' }).success).toBe(true)
  })
})

describe('the bill’s inputs', () => {
  it('take a decision as a yes or a no', () => {
    expect(requestDecision.parse({ changeId: A, accept: false })).toEqual({ changeId: A, accept: false })
    expect(requestDecision.safeParse({ changeId: A, accept: 'yes' }).success).toBe(false)
  })

  it('close without force unless it is asked for', () => {
    expect(billClose.parse({ billId: A })).toEqual({ billId: A, force: false })
    expect(billClose.parse({ billId: A, force: true }).force).toBe(true)
  })

  it('refuse a merge of a bill into itself', () => {
    expect(billMerge.safeParse({ billId: A, intoId: A }).success).toBe(false)
    expect(billMerge.parse({ billId: A, intoId: B })).toEqual({ billId: A, intoId: B })
  })

  it('take a move to a table, with the bill to merge into when asked', () => {
    expect(billMove.parse({ billId: A, table: ' 7 ' })).toEqual({ billId: A, table: '7' })
    expect(billMove.parse({ billId: A, table: '7', mergeInto: B }).mergeInto).toBe(B)
    expect(billMove.safeParse({ billId: A, table: '' }).success).toBe(false)
  })

  it('take one bill to un-merge and one order to read the log of', () => {
    expect(billUnmerge.parse({ billId: A })).toEqual({ billId: A })
    expect(changeLogQuery.safeParse({ orderId: 'nope' }).success).toBe(false)
  })
})
