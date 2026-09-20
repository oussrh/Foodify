import { describe, expect, it } from 'vitest'
import { listParams, listQuery, page, pageArgs } from './list'

const id = (n: number) => `4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e${String(n).padStart(2, '0')}`

describe('a followable list', () => {
  it('reads a limit within its bounds and an optional cursor; refuses a cursor that is not an id', () => {
    expect(listQuery.safeParse(listParams(new URLSearchParams(''))).data).toEqual({ limit: 100 })
    expect(listQuery.safeParse(listParams(new URLSearchParams('limit=5&cursor=' + id(1)))).data).toEqual({ limit: 5, cursor: id(1) })
    expect(listQuery.safeParse(listParams(new URLSearchParams('limit=5000'))).success).toBe(false)
    expect(listQuery.safeParse(listParams(new URLSearchParams('cursor=1'))).success).toBe(false)
  })

  it('asks Prisma for one row more than the page, after the cursor when there is one', () => {
    expect(pageArgs({ limit: 2 })).toEqual({ take: 3 })
    expect(pageArgs({ limit: 2, cursor: id(1) })).toEqual({ take: 3, cursor: { id: id(1) }, skip: 1 })
  })

  it('trims the extra row into the next cursor, and says null on the last page', () => {
    const rows = [{ id: id(1) }, { id: id(2) }, { id: id(3) }]
    expect(page(rows, 2)).toEqual({ data: [{ id: id(1) }, { id: id(2) }], next: id(2) })
    expect(page(rows.slice(0, 2), 2)).toEqual({ data: rows.slice(0, 2), next: null })
  })
})
