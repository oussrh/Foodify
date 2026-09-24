import { describe, expect, it } from 'vitest'
import { CODE_LENGTH, isRestaurantCode, newRestaurantCode, parseRestaurantCode, restaurantWhere } from './restaurant-code'

// A code is read off a screen and typed into a tablet by somebody standing up, so what matters is
// that it cannot contain a character that is read as another one, and that a near-miss is either
// corrected or refused rather than resolved to the wrong restaurant.

describe('newRestaurantCode', () => {
  it('is six characters of the alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = newRestaurantCode()
      expect(code).toHaveLength(CODE_LENGTH)
      expect(isRestaurantCode(code)).toBe(true)
    }
  })

  it('never contains a character that is read as another one', () => {
    // I and 1, O and 0, and U because it makes words. Two hundred draws is enough to catch a
    // generator that can emit them at all.
    const codes = Array.from({ length: 200 }, () => newRestaurantCode()).join('')
    expect(codes).not.toMatch(/[ILOU]/)
  })

  it('spreads over the alphabet rather than favouring its start', () => {
    const codes = Array.from({ length: 300 }, () => newRestaurantCode()).join('')
    expect(new Set(codes).size).toBeGreaterThan(20)
  })

  it('takes the randomness it is given, so a collision can be reproduced in a test', () => {
    const always = () => 0
    expect(newRestaurantCode(always)).toBe('000000')
  })
})

describe('isRestaurantCode', () => {
  it('accepts a code and refuses a uuid, which is how a route tells them apart', () => {
    expect(isRestaurantCode('K7M2QX')).toBe(true)
    expect(isRestaurantCode('54d3dcf7-5297-4b2e-99ac-ae4197735f29')).toBe(false)
  })

  it('refuses the wrong length, lower case, and the excluded letters', () => {
    expect(isRestaurantCode('K7M2Q')).toBe(false)
    expect(isRestaurantCode('K7M2QXX')).toBe(false)
    expect(isRestaurantCode('k7m2qx')).toBe(false)
    expect(isRestaurantCode('K7M2QI')).toBe(false)
  })
})

describe('parseRestaurantCode', () => {
  it('takes what somebody typed and gives back what is stored', () => {
    expect(parseRestaurantCode('  k7m2qx ')).toBe('K7M2QX')
  })

  it('folds the characters people substitute, rather than refusing them', () => {
    // Typed from a screen, an I is a 1 and an O is a 0 more often than they are mistakes.
    expect(parseRestaurantCode('I7M2QX')).toBe('17M2QX')
    expect(parseRestaurantCode('l7m2qx')).toBe('17M2QX')
    expect(parseRestaurantCode('O7M2QX')).toBe('07M2QX')
    expect(parseRestaurantCode('U7M2QX')).toBe('V7M2QX')
  })

  it('is null for anything that is not a code, rather than a guess', () => {
    expect(parseRestaurantCode('54d3dcf7-5297-4b2e-99ac-ae4197735f29')).toBeNull()
    expect(parseRestaurantCode('')).toBeNull()
    expect(parseRestaurantCode('K7M2Q!')).toBeNull()
  })
})

describe('restaurantWhere', () => {
  it('finds a code by the code column and anything else by the id', () => {
    expect(restaurantWhere('K7M2QX')).toEqual({ code: 'K7M2QX' })
    expect(restaurantWhere('54d3dcf7-5297-4b2e-99ac-ae4197735f29')).toEqual({ id: '54d3dcf7-5297-4b2e-99ac-ae4197735f29' })
  })
})
