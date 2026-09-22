import { describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/client'
import { DEVICE_ROLES, isDeviceAccount, ROLE_DESCRIPTION, ROLE_HOME, ROLE_LABEL, roleLabel } from './roles'

// This module exists so that a fact about a role is stated once instead of at every call site
// that cares. The bug it was written after: `setMfaEnabled` refused a second factor to KITCHEN by
// naming the role, so WAITER — added later — could turn one on and lock itself out for good,
// because a device has no mailbox to receive the code. These tests are the part that makes the
// module keep its promise: they walk every role the database can hold, so a fifth one added
// tomorrow fails here rather than in production.
const ALL_ROLES = Object.values(UserRole)

describe('the set of roles', () => {
  it('covers every role the database can hold, in each of the tables', () => {
    expect(ALL_ROLES.length).toBeGreaterThan(0)
    for (const role of ALL_ROLES) {
      expect(ROLE_LABEL[role], `no label for ${role}`).toBeTruthy()
      expect(ROLE_DESCRIPTION[role], `no description for ${role}`).toBeTruthy()
      expect(ROLE_HOME[role], `no home for ${role}`).toBeTruthy()
    }
  })

  it('never shows a reader the stored value', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABEL[role]).not.toBe(role)
      expect(ROLE_LABEL[role]).not.toMatch(/_/)
    }
  })

  it('sends every role to a home inside the app', () => {
    for (const role of ALL_ROLES) expect(ROLE_HOME[role]).toMatch(/^\//)
  })
})

describe('isDeviceAccount', () => {
  it('is true for the accounts that have no mailbox, and false for the people who do', () => {
    // Stated one role at a time rather than derived from DEVICE_ROLES: a test that reads the same
    // list as the code proves the list is consistent with itself and nothing else.
    expect(isDeviceAccount('KITCHEN')).toBe(true)
    expect(isDeviceAccount('WAITER')).toBe(true)
    expect(isDeviceAccount('RESTAURANT_ADMIN')).toBe(false)
    expect(isDeviceAccount('SUPER_ADMIN')).toBe(false)
  })

  it('classifies every role the database can hold, one way or the other', () => {
    for (const role of ALL_ROLES) expect(typeof isDeviceAccount(role)).toBe('boolean')
  })

  it('agrees with DEVICE_ROLES, which is what the guards read', () => {
    for (const role of ALL_ROLES) {
      expect(isDeviceAccount(role)).toBe((DEVICE_ROLES as readonly string[]).includes(role))
    }
  })

  it('is false for a value that is not a role at all, rather than throwing', () => {
    expect(isDeviceAccount('')).toBe(false)
    expect(isDeviceAccount('kitchen')).toBe(false)
    expect(isDeviceAccount('OWNER')).toBe(false)
  })
})

describe('roleLabel', () => {
  it('names a role read back from a session or an old row', () => {
    expect(roleLabel('KITCHEN')).toBe('Order tablet')
    expect(roleLabel('RESTAURANT_ADMIN')).toBe('Restaurant manager')
  })

  it('shows an unknown value as itself rather than as "undefined"', () => {
    expect(roleLabel('OWNER')).toBe('OWNER')
  })
})
