import { describe, expect, it } from 'vitest'
import { fromMinorUnits, multiplyPrice, sumPrices, toMinorUnits } from './money'

describe('toMinorUnits', () => {
  it('reads a price with one, two or no fraction digits', () => {
    expect(toMinorUnits('12.50')).toBe(1250)
    expect(toMinorUnits('12.5')).toBe(1250)
    expect(toMinorUnits('12')).toBe(1200)
    expect(toMinorUnits('0.05')).toBe(5)
  })

  it('refuses anything that is not a plain two-decimal price', () => {
    for (const bad of ['12.345', '-1.00', '1,50', '', 'ten', '1e2']) {
      expect(() => toMinorUnits(bad)).toThrow(/Not a price/)
    }
  })
})

describe('fromMinorUnits', () => {
  it('always writes two fraction digits', () => {
    expect(fromMinorUnits(1250)).toBe('12.50')
    expect(fromMinorUnits(5)).toBe('0.05')
    expect(fromMinorUnits(0)).toBe('0.00')
    expect(fromMinorUnits(100)).toBe('1.00')
  })
})

describe('multiplyPrice', () => {
  it('multiplies without the float error a number would carry', () => {
    expect(multiplyPrice('0.10', 3)).toBe('0.30')
    expect(multiplyPrice('12.99', 7)).toBe('90.93')
    expect(multiplyPrice('4.20', 0)).toBe('0.00')
  })
})

describe('sumPrices', () => {
  it('is 0.00 for no lines and the exact total otherwise', () => {
    expect(sumPrices([])).toBe('0.00')
    expect(sumPrices([{ price: '0.10', quantity: 3 }, { price: '0.20', quantity: 1 }])).toBe('0.50')
    expect(sumPrices([{ price: '12.99', quantity: 2 }, { price: '4.50', quantity: 3 }])).toBe('39.48')
  })
})
