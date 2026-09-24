import { describe, expect, it } from 'vitest'
import { billActor, changeLabel, pendingRefusal, reasonComplete, REASON_LABEL, staffChange, voidable, voidRefusal } from './bill-rules'

// Who may take what off a sent order. Each expectation is written out, status by status and
// actor by actor, rather than read back from the module: the table is the owner's decision, and
// a change to the rule has to change it here as well.

describe('billActor', () => {
  it('reads a super admin and a restaurant manager as managers', () => {
    expect(billActor('SUPER_ADMIN')).toBe('manager')
    expect(billActor('RESTAURANT_ADMIN')).toBe('manager')
  })

  it('reads a waiter as the floor and a tablet as the kitchen', () => {
    expect(billActor('WAITER')).toBe('waiter')
    expect(billActor('KITCHEN')).toBe('kitchen')
  })

  it('reads an unknown role as the kitchen, which the floor’s changes refuse', () => {
    expect(billActor('SOMETHING_NEW')).toBe('kitchen')
  })
})

describe('staffChange: a cancel or a removal by the floor', () => {
  it('goes through at once while the kitchen has not started the ticket', () => {
    expect(staffChange('waiter', 'NEW')).toBe('direct')
    expect(staffChange('manager', 'NEW')).toBe('direct')
  })

  it('becomes a request the kitchen answers once the ticket is being made', () => {
    expect(staffChange('waiter', 'ACCEPTED')).toBe('request')
    expect(staffChange('manager', 'ACCEPTED')).toBe('request')
  })

  it('is refused once the ticket is plated or served: that is a manager’s void', () => {
    for (const status of ['READY', 'DONE'] as const) {
      expect(staffChange('waiter', status)).toBe('manager_only')
      expect(staffChange('manager', status)).toBe('manager_only')
    }
  })

  it('is refused on a ticket already cancelled', () => {
    expect(staffChange('waiter', 'CANCELLED')).toBe('cancelled')
  })

  it('is never the kitchen tablet’s, at any status', () => {
    for (const status of ['NEW', 'ACCEPTED', 'READY', 'DONE', 'CANCELLED'] as const) expect(staffChange('kitchen', status)).toBe('not_staff')
  })
})

describe('voidRefusal: a manager’s void', () => {
  it('lets a manager void a ticket that is ready or served', () => {
    expect(voidRefusal('manager', 'READY')).toBeNull()
    expect(voidRefusal('manager', 'DONE')).toBeNull()
    expect(voidable('READY')).toBe(true)
    expect(voidable('DONE')).toBe(true)
  })

  it('sends a manager to cancel or remove before it has left the kitchen, and refuses a cancelled ticket', () => {
    expect(voidRefusal('manager', 'NEW')).toBe('not_served')
    expect(voidRefusal('manager', 'ACCEPTED')).toBe('not_served')
    expect(voidRefusal('manager', 'CANCELLED')).toBe('cancelled')
    expect(voidable('ACCEPTED')).toBe(false)
    expect(voidable('CANCELLED')).toBe(false)
  })

  it('refuses a waiter and a kitchen tablet, even on a served ticket', () => {
    for (const status of ['NEW', 'READY', 'DONE'] as const) {
      expect(voidRefusal('waiter', status)).toBe('not_manager')
      expect(voidRefusal('kitchen', status)).toBe('not_manager')
    }
  })
})

describe('pendingRefusal: one open request per line and per ticket', () => {
  it('takes a first request', () => {
    expect(pendingRefusal([], { kind: 'REMOVE', lineId: 'l1' })).toBeNull()
    expect(pendingRefusal([], { kind: 'CANCEL', lineId: null })).toBeNull()
  })

  it('refuses a second removal of the same line, and takes one of another line', () => {
    const open = [{ kind: 'REMOVE', lineId: 'l1' }]
    expect(pendingRefusal(open, { kind: 'REMOVE', lineId: 'l1' })).toBe('pending')
    expect(pendingRefusal(open, { kind: 'REMOVE', lineId: 'l2' })).toBeNull()
  })

  it('refuses anything more once the whole ticket is asked to be cancelled', () => {
    const open = [{ kind: 'CANCEL', lineId: null }]
    expect(pendingRefusal(open, { kind: 'CANCEL', lineId: null })).toBe('pending')
    expect(pendingRefusal(open, { kind: 'REMOVE', lineId: 'l2' })).toBe('pending')
  })

  it('takes a cancel of the ticket while a removal of one line waits', () => {
    expect(pendingRefusal([{ kind: 'REMOVE', lineId: 'l1' }], { kind: 'CANCEL', lineId: null })).toBeNull()
  })
})

describe('the reasons', () => {
  it('names each reason the way a waiter picks it', () => {
    expect(REASON_LABEL).toEqual({
      changed_mind: 'Guest changed their mind',
      mistake: 'Ordered by mistake',
      too_slow: 'Took too long',
      unavailable: 'Kitchen can’t make it',
      other: 'Other',
    })
  })

  it('needs a note for other, and for no other reason', () => {
    expect(reasonComplete('other', undefined)).toBe(false)
    expect(reasonComplete('other', '   ')).toBe(false)
    expect(reasonComplete('other', 'Allergy')).toBe(true)
    expect(reasonComplete('mistake', undefined)).toBe(true)
    expect(reasonComplete('too_slow', null)).toBe(true)
  })
})

describe('changeLabel', () => {
  it('says what the button does: now, or by asking the kitchen', () => {
    expect(changeLabel('direct', 'cancel')).toBe('Cancel order')
    expect(changeLabel('request', 'cancel')).toBe('Ask the kitchen to cancel')
    expect(changeLabel('direct', 'remove')).toBe('Remove')
    expect(changeLabel('request', 'remove')).toBe('Ask to remove')
  })
})
