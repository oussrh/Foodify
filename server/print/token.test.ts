import { describe, expect, it } from 'vitest'
import { hashPrinterToken, newPrinterToken } from './token'

describe('printer tokens', () => {
  it('are 32 URL-safe characters, stored as their SHA-256', () => {
    const { token, hash } = newPrinterToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(hash).toBe(hashPrinterToken(token))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('never repeat', () => {
    expect(newPrinterToken().token).not.toBe(newPrinterToken().token)
  })
})
