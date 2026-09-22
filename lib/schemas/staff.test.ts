import { describe, expect, it } from 'vitest'
import { staffAccount, staffRole } from './staff'

// The shape the staff actions parse before they write an account. What matters is what it
// refuses: a role these actions may not create, and a username that would not survive being
// typed into a tablet by somebody holding a pan.

describe('staffRole', () => {
  it('takes the two roles these actions may create', () => {
    expect(staffRole.parse('KITCHEN')).toBe('KITCHEN')
    expect(staffRole.parse('WAITER')).toBe('WAITER')
  })

  it('refuses a role that is made elsewhere, under its own guard', () => {
    // The door this closes: a caller cannot mint an admin through the staff form.
    expect(staffRole.safeParse('SUPER_ADMIN').success).toBe(false)
    expect(staffRole.safeParse('RESTAURANT_ADMIN').success).toBe(false)
    expect(staffRole.safeParse('kitchen').success).toBe(false)
  })
})

describe('staffAccount', () => {
  it('takes a username and the password set with it', () => {
    expect(staffAccount.parse({ username: 'kitchen1', password: 'changeme' })).toEqual({
      username: 'kitchen1',
      password: 'changeme',
    })
  })

  it('folds a username to lower case, so a capital typed on a tablet is not a second account', () => {
    expect(staffAccount.parse({ username: 'Kitchen1', password: 'changeme' }).username).toBe('kitchen1')
  })

  it('refuses a password too short to be one', () => {
    expect(staffAccount.safeParse({ username: 'kitchen1', password: 'abc' }).success).toBe(false)
  })

  it('refuses a username that is too short, too long, or carries a space', () => {
    expect(staffAccount.safeParse({ username: 'ab', password: 'changeme' }).success).toBe(false)
    expect(staffAccount.safeParse({ username: 'k'.repeat(33), password: 'changeme' }).success).toBe(false)
    expect(staffAccount.safeParse({ username: 'kitchen 1', password: 'changeme' }).success).toBe(false)
  })

  it('takes the punctuation a name is actually written with', () => {
    for (const username of ['kitchen.1', 'kitchen-1', 'kitchen_1']) {
      expect(staffAccount.safeParse({ username, password: 'changeme' }).success, username).toBe(true)
    }
  })

  it('refuses an address in place of a username: a device has no mailbox', () => {
    expect(staffAccount.safeParse({ username: 'kitchen@foodify.test', password: 'changeme' }).success).toBe(false)
  })
})
