import { describe, expect, it } from 'vitest'
import { billChoice, sendLabel } from './bill-choice'

// Which bill a waiter's send goes to. The failure this guards: a table whose bill has not been
// read yet (or could not be) silently opening a second bill, or a re-seated table adding to lunch.

const tab = (addByDefault: boolean) => ({ parent: { id: 'o12', number: 12 }, addByDefault })

describe('billChoice', () => {
  it('never adds before the table has been read, or when it could not be', () => {
    expect(billChoice({ status: 'checking', tab: null }, null)).toEqual({ bill: { kind: 'checking' }, addTo: null })
    expect(billChoice({ status: 'failed', tab: null }, 'add')).toEqual({ bill: { kind: 'failed' }, addTo: null })
  })

  it('sends a new order at a table with no bill', () => {
    expect(billChoice({ status: 'ready', tab: null }, null)).toEqual({ bill: { kind: 'none' }, addTo: null })
  })

  it('follows the bill’s default until the waiter chooses', () => {
    expect(billChoice({ status: 'ready', tab: tab(true) }, null)).toEqual({ bill: { kind: 'open', number: 12, adding: true }, addTo: 'o12' })
    expect(billChoice({ status: 'ready', tab: tab(false) }, null)).toEqual({ bill: { kind: 'open', number: 12, adding: false }, addTo: null })
  })

  it('lets the waiter’s choice override the default either way', () => {
    expect(billChoice({ status: 'ready', tab: tab(true) }, 'new').addTo).toBeNull()
    expect(billChoice({ status: 'ready', tab: tab(false) }, 'add').addTo).toBe('o12')
  })
})

describe('sendLabel', () => {
  it('says where the order is going', () => {
    expect(sendLabel({ kind: 'checking' })).toBe('Checking the table…')
    expect(sendLabel({ kind: 'none' })).toBe('Send to the kitchen')
    expect(sendLabel({ kind: 'open', number: 12, adding: true })).toBe('Add to order #12')
    expect(sendLabel({ kind: 'open', number: 12, adding: false })).toBe('Send as a new order')
    expect(sendLabel({ kind: 'failed' })).toBe('Send as a new order')
  })
})
