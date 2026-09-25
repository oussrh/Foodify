import { describe, expect, it } from 'vitest'
import { newerBuild } from './staff-build'

const health = (build: unknown) => ({ data: { status: 'ok', database: 'ok', build } })

describe('newerBuild', () => {
  it('names the served build when it is not the one this page runs', () => {
    expect(newerBuild('a1b2c3d4', health('e5f6a7b8'))).toBe('e5f6a7b8')
  })

  it('says nothing for the same build, or a development server', () => {
    expect(newerBuild('a1b2c3d4', health('a1b2c3d4'))).toBeNull()
    expect(newerBuild('a1b2c3d4', health('dev'))).toBeNull()
  })

  it('never builds an address from an answer it cannot read', () => {
    expect(newerBuild('a1b2c3d4', null)).toBeNull()
    expect(newerBuild('a1b2c3d4', { error: 'Shutting down', code: 'draining' })).toBeNull()
    expect(newerBuild('a1b2c3d4', health('../evil?x=1'))).toBeNull()
    expect(newerBuild('a1b2c3d4', health(42))).toBeNull()
  })
})
