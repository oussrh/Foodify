import { describe, expect, it } from 'vitest'
import { changeAnswer, changeHeadline, changeWhy, type ChangeLogEntry } from './change-log'

// The change log's sentences, for a manager reading what happened to a bill.

const entry = (over: Partial<ChangeLogEntry> = {}): ChangeLogEntry => ({
  id: 'c1',
  kind: 'REMOVE',
  status: 'APPLIED',
  dish: 'Tea',
  quantity: 1,
  reason: 'mistake',
  note: null,
  fromTable: null,
  toTable: null,
  mergedNumber: null,
  by: 'w-anna',
  decidedBy: null,
  createdAt: '2026-09-24T19:00:00.000Z',
  decidedAt: null,
  ...over,
})

describe('changeHeadline', () => {
  it('names a removal, a request for one and a void by the dish', () => {
    expect(changeHeadline(entry())).toBe('Removed 1 Tea')
    expect(changeHeadline(entry({ status: 'PENDING', quantity: 2 }))).toBe('Asked to remove 2 Tea')
    expect(changeHeadline(entry({ status: 'REFUSED' }))).toBe('Asked to remove 1 Tea')
    expect(changeHeadline(entry({ kind: 'VOID' }))).toBe('Voided 1 Tea')
    expect(changeHeadline(entry({ kind: 'VOID', dish: null, quantity: null }))).toBe('Voided the order')
  })

  it('names a cancel, and one only asked for', () => {
    expect(changeHeadline(entry({ kind: 'CANCEL', dish: null }))).toBe('Cancelled the order')
    expect(changeHeadline(entry({ kind: 'CANCEL', dish: null, status: 'PENDING' }))).toBe('Asked to cancel the order')
  })

  it('names a close, and says when dishes were still in the kitchen', () => {
    expect(changeHeadline(entry({ kind: 'CLOSE', dish: null, quantity: null }))).toBe('Closed the bill')
    expect(changeHeadline(entry({ kind: 'CLOSE', dish: null, quantity: 3 }))).toBe('Closed the bill with 3 still in the kitchen')
  })

  it('names a merge, its undo and a move', () => {
    expect(changeHeadline(entry({ kind: 'MERGE', mergedNumber: 14 }))).toBe('Merged with #14')
    expect(changeHeadline(entry({ kind: 'UNMERGE', mergedNumber: 14 }))).toBe('Split #14 off again')
    expect(changeHeadline(entry({ kind: 'MERGE' }))).toBe('Merged with #?')
    expect(changeHeadline(entry({ kind: 'MOVE', fromTable: '3', toTable: '5' }))).toBe('Moved from table 3 to 5')
    expect(changeHeadline(entry({ kind: 'MOVE' }))).toBe('Moved from table ? to ?')
  })
})

describe('changeWhy', () => {
  it('gives the reason, and the note after it', () => {
    expect(changeWhy(entry())).toBe('Ordered by mistake')
    expect(changeWhy(entry({ reason: 'other', note: 'Allergy' }))).toBe('Other: Allergy')
  })

  it('is nothing for a change that needs no reason', () => {
    expect(changeWhy(entry({ reason: null }))).toBeNull()
  })
})

describe('changeAnswer', () => {
  it('says a request is waiting, then who answered it and how', () => {
    expect(changeAnswer(entry({ status: 'PENDING' }))).toBe('Waiting for the kitchen')
    expect(changeAnswer(entry({ status: 'REFUSED', decidedBy: 'k-pass', decidedAt: '2026-09-24T19:05:00.000Z' }))).toBe('Refused by k-pass')
    expect(changeAnswer(entry({ decidedAt: '2026-09-24T19:05:00.000Z' }))).toBe('Accepted by the kitchen')
  })

  it('is nothing for a change applied as it was made', () => {
    expect(changeAnswer(entry())).toBeNull()
  })
})
