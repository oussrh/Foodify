import { describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { isRestaurantCode } from '@/lib/restaurant-code'
import { withRestaurantCode } from './restaurant-code-assign'

// The point of this helper is what it does *not* retry. Retrying a collision is cheap and
// correct; retrying a taken slug nine more times is a bug that would look like flakiness.

const prismaError = (code: string, target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError('constraint failed', { code, clientVersion: 'test', meta: { target } })

describe('withRestaurantCode', () => {
  it('hands the create a code and gives back what it made', async () => {
    const create = vi.fn(async (code: string) => ({ id: 'r1', code }))

    const made = await withRestaurantCode(create)

    expect(create).toHaveBeenCalledTimes(1)
    expect(isRestaurantCode(made.code)).toBe(true)
  })

  it('redraws when the index says that code is taken, with a different one', async () => {
    const seen: string[] = []
    const create = vi.fn(async (code: string) => {
      seen.push(code)
      if (seen.length === 1) throw prismaError('P2002', ['code'])
      return { code }
    })

    const made = await withRestaurantCode(create)

    expect(create).toHaveBeenCalledTimes(2)
    expect(made.code).toBe(seen[1])
    expect(seen[0]).not.toBe(seen[1])
  })

  it('does not retry another column: a taken slug is the caller’s to answer for', async () => {
    const create = vi.fn(async () => {
      throw prismaError('P2002', ['slug'])
    })

    await expect(withRestaurantCode(create)).rejects.toMatchObject({ code: 'P2002' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('does not retry a failure that is not a unique violation at all', async () => {
    const create = vi.fn(async () => {
      throw prismaError('P2003', ['restaurantId'])
    })

    await expect(withRestaurantCode(create)).rejects.toMatchObject({ code: 'P2003' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('rethrows an ordinary error untouched, rather than treating it as bad luck', async () => {
    const create = vi.fn(async () => {
      throw new Error('the database is down')
    })

    await expect(withRestaurantCode(create)).rejects.toThrow('the database is down')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('does not retry a unique violation that names no column, rather than guessing it was ours', async () => {
    // Prisma does not always fill `meta`. An unnamed constraint is not evidence of a collision.
    const bare = new Prisma.PrismaClientKnownRequestError('constraint failed', { code: 'P2002', clientVersion: 'test' })
    const create = vi.fn(async () => {
      throw bare
    })

    await expect(withRestaurantCode(create)).rejects.toMatchObject({ code: 'P2002' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('gives up rather than looping for ever: ten collisions is a broken generator', async () => {
    const create = vi.fn(async () => {
      throw prismaError('P2002', ['code'])
    })

    await expect(withRestaurantCode(create)).rejects.toMatchObject({ code: 'P2002' })
    expect(create).toHaveBeenCalledTimes(10)
  })
})
