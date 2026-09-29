import { describe, expect, it, vi } from 'vitest'

const info = vi.fn()
vi.mock('@/server/log', () => ({ log: { child: () => ({ info }) } }))

const { audited, auditPos } = await import('./audit')

describe('the POS audit line', () => {
  it('names the actor by id and role, and marks a super admin as acting on the owner’s behalf', () => {
    auditPos({ id: 'u-1', role: 'SUPER_ADMIN' }, 'r-1', 'activate', 'ok')
    expect(info).toHaveBeenLastCalledWith({ actorId: 'u-1', role: 'SUPER_ADMIN', onBehalf: true, restaurantId: 'r-1', action: 'activate', outcome: 'ok' }, 'pos: activate ok')
    auditPos({ id: 'u-2', role: 'RESTAURANT_ADMIN' }, 'r-1', 'pause', 'ok')
    expect(info).toHaveBeenLastCalledWith(expect.objectContaining({ onBehalf: false }), 'pos: pause ok')
  })

  it('logs an outcome as ok or refused, and hands it back unchanged', () => {
    const refused = { ok: false as const, error: 'Wrong key' }
    expect(audited({ id: 'u-2', role: 'RESTAURANT_ADMIN' }, 'r-1', 'connect', refused)).toBe(refused)
    expect(info).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'refused' }), 'pos: connect refused')
    audited({ id: 'u-2', role: 'RESTAURANT_ADMIN' }, 'r-1', 'connect', { ok: true })
    expect(info).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'ok' }), 'pos: connect ok')
  })
})
