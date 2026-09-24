import { describe, expect, it } from 'vitest'
import { afterCursor, decodeCursor, encodeCursor, listParams, listQuery, page, pageArgs } from './list'

const id = (n: number) => `4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e${String(n).padStart(2, '0')}`

describe('a followable list', () => {
  it('reads a limit within its bounds and an optional cursor', () => {
    expect(listQuery.safeParse(listParams(new URLSearchParams(''))).data).toEqual({ limit: 100 })
    expect(listQuery.safeParse(listParams(new URLSearchParams('limit=5&cursor=abc'))).data).toEqual({ limit: 5, cursor: 'abc' })
    expect(listQuery.safeParse(listParams(new URLSearchParams('limit=5000'))).success).toBe(false)
    expect(listQuery.safeParse(listParams(new URLSearchParams('limit=0'))).success).toBe(false)
  })

  it('writes a cursor it can read back, and reads anything else as no cursor', () => {
    const key = { sort: 'Chez Test & Co', id: id(1) }
    expect(decodeCursor(encodeCursor(key))).toEqual(key)
    expect(decodeCursor('not-a-cursor')).toBeNull()
    expect(decodeCursor(Buffer.from('["one"]').toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from('["a","b","c"]').toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from('["a",1]').toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from('{"sort":"a","id":"b"}').toString('base64url'))).toBeNull()
  })

  it('asks Prisma for one row more than the page, and for the rows after the key in (field, id) order', () => {
    expect(pageArgs({ limit: 2 })).toEqual({ take: 3 })
    expect(afterCursor('name', undefined)).toEqual({})
    expect(afterCursor('name', encodeCursor({ sort: 'B', id: id(2) }))).toEqual({ OR: [{ name: { gt: 'B' } }, { name: 'B', id: { gt: id(2) } }] })
    expect(afterCursor('name', 'garbage')).toEqual({})
  })

  it('trims the extra row into the next cursor, and says null on the last page', () => {
    const rows = [{ id: id(1), name: 'A' }, { id: id(2), name: 'B' }, { id: id(3), name: 'C' }]
    const first = page(rows, 2, 'name')
    expect(first.data).toEqual(rows.slice(0, 2))
    expect(decodeCursor(first.next!)).toEqual({ sort: 'B', id: id(2) })
    expect(page(rows.slice(0, 2), 2, 'name')).toEqual({ data: rows.slice(0, 2), next: null })
  })
})
