import { describe, expect, it } from 'vitest'
import { eposCall, printerName, printTrigger } from './print'

describe('printerName', () => {
  it('trims a name and refuses an empty or overlong one', () => {
    expect(printerName.parse('  Pass ')).toBe('Pass')
    expect(printerName.safeParse('  ').success).toBe(false)
    expect(printerName.safeParse('x'.repeat(41)).success).toBe(false)
  })
})

describe('printTrigger', () => {
  it('takes the two moments and nothing else', () => {
    expect(printTrigger.parse('ACCEPT')).toBe('ACCEPT')
    expect(printTrigger.safeParse('LATER').success).toBe(false)
  })
})


describe('eposCall', () => {
  it('reads the call and its result file, ignoring the printer’s other fields', () => {
    expect(eposCall.parse({ ConnectionType: 'SetResponse', ID: 'kitchen', ResponseFile: '<x/>' })).toEqual({ ConnectionType: 'SetResponse', ResponseFile: '<x/>' })
  })

  it('refuses a form without a call', () => {
    expect(eposCall.safeParse({ ID: 'kitchen' }).success).toBe(false)
  })
})
