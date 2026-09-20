import { describe, expect, it } from 'vitest'
import { categoryPayload, dishPayload, idOnly, ingredientPayload, restaurantPayload, userPayload } from './payloads'

const SECRET = ['passwordHash', 'totpSecret', 'emailOtpCode', 'emailOtpExpires', 'passwordResetToken', 'passwordResetExpires', 'emailChangeToken', 'emailVerifyToken', 'newEmail']

describe('the mutation payloads', () => {
  it('each carries the id, and no payload names a secret column', () => {
    for (const payload of [idOnly, userPayload, dishPayload, ingredientPayload, categoryPayload, restaurantPayload]) {
      expect(payload.id).toBe(true)
      expect(Object.keys(payload).filter((k) => SECRET.includes(k))).toEqual([])
    }
  })

  it('keeps a dish payload off the Decimal price', () => {
    expect(Object.keys(dishPayload)).not.toContain('price')
  })
})
