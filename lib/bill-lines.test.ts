import { describe, expect, it } from 'vitest'
import { allRemoved, dishesInKitchen, removeFrom, ticketSubtotal } from './bill-lines'

// What a ticket comes to once dishes have come off it: worked out on integers, from what is left
// on each line, with the line itself never lost.

const line = (unitPrice: string, quantity: number, removedQuantity = 0) => ({ unitPrice, quantity, removedQuantity })

describe('ticketSubtotal', () => {
  it('prices what is left on each line', () => {
    expect(ticketSubtotal([line('4.50', 3, 1), line('12.00', 1)])).toBe('21.00')
  })

  it('keeps the cents a float would lose', () => {
    expect(ticketSubtotal([line('0.10', 3, 0), line('0.20', 2, 1)])).toBe('0.50')
  })

  it('is zero for a ticket whose every line was taken off', () => {
    expect(ticketSubtotal([line('9.50', 2, 2)])).toBe('0.00')
  })
})

describe('removeFrom', () => {
  it('answers the line’s new removed count', () => {
    expect(removeFrom({ quantity: 3, removedQuantity: 0 }, 1)).toBe(1)
    expect(removeFrom({ quantity: 3, removedQuantity: 1 }, 2)).toBe(3)
  })

  it('refuses more than is left', () => {
    expect(removeFrom({ quantity: 3, removedQuantity: 2 }, 2)).toBe('too_many')
  })

  it('says so when nothing is left on the line', () => {
    expect(removeFrom({ quantity: 2, removedQuantity: 2 }, 1)).toBe('nothing_left')
  })
})

describe('allRemoved', () => {
  it('is true only when every line is taken off whole: the ticket is then cancelled', () => {
    expect(allRemoved([{ quantity: 2, removedQuantity: 2 }, { quantity: 1, removedQuantity: 1 }])).toBe(true)
    expect(allRemoved([{ quantity: 2, removedQuantity: 2 }, { quantity: 1, removedQuantity: 0 }])).toBe(false)
    expect(allRemoved([{ quantity: 2, removedQuantity: 1 }])).toBe(false)
  })
})

describe('dishesInKitchen', () => {
  const ticket = (status: 'NEW' | 'ACCEPTED' | 'READY' | 'DONE' | 'CANCELLED', lines = [{ quantity: 2, removedQuantity: 0 }]) => ({ status, lines })

  it('counts the portions of every ticket not yet served, net of removals', () => {
    expect(dishesInKitchen([ticket('NEW'), ticket('ACCEPTED', [{ quantity: 3, removedQuantity: 1 }]), ticket('READY')])).toBe(6)
  })

  it('leaves out what was served and what was cancelled', () => {
    expect(dishesInKitchen([ticket('DONE'), ticket('CANCELLED')])).toBe(0)
  })
})
