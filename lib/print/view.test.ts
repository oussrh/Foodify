import { describe, expect, it } from 'vitest'
import { OFFLINE_AFTER_MS, printerAddress, printerOnline } from './view'

describe('printerOnline', () => {
  const now = Date.parse('2026-09-28T12:00:00Z')

  it('is false for a printer that never asked', () => {
    expect(printerOnline(null, now)).toBe(false)
  })

  it('is true inside the window and false from its end', () => {
    expect(printerOnline(new Date(now - OFFLINE_AFTER_MS + 1).toISOString(), now)).toBe(true)
    expect(printerOnline(new Date(now - OFFLINE_AFTER_MS).toISOString(), now)).toBe(false)
  })
})

describe('printerAddress', () => {
  it('joins the origin and the token, whatever slashes the origin ends with', () => {
    expect(printerAddress('https://foodify.app/', 'abc')).toBe('https://foodify.app/api/print/epson/abc')
    expect(printerAddress('https://foodify.app', 'abc')).toBe('https://foodify.app/api/print/epson/abc')
  })
})
