import { afterEach, describe, expect, it, vi } from 'vitest'

const { after, log } = vi.hoisted(() => ({ after: vi.fn(), log: { error: vi.fn() } }))
vi.mock('next/server', () => ({ after }))
vi.mock('@/server/log', () => ({ log }))

import { afterResponse } from './after-response'

describe('afterResponse', () => {
  afterEach(() => vi.clearAllMocks())

  it('hands the task to Next, which runs it once the response has gone', () => {
    const task = vi.fn(async () => 'done')
    afterResponse(task)
    expect(after).toHaveBeenCalledTimes(1)
    expect(task).not.toHaveBeenCalled()
  })

  it('starts the task at once when there is no request to wait for', async () => {
    after.mockImplementationOnce(() => {
      throw new Error('`after` was called outside a request scope')
    })
    const task = vi.fn(async () => 'done')
    afterResponse(task)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('logs a task that rejects, and never lets it escape', async () => {
    after.mockImplementationOnce((run: () => Promise<unknown>) => run())
    let settled: Promise<unknown> = Promise.resolve()
    after.mockImplementationOnce((run: () => Promise<unknown>) => {
      settled = run()
    })
    afterResponse(async () => 'fine')
    afterResponse(async () => {
      throw new Error('push service down')
    })
    await settled
    expect(log.error).toHaveBeenCalledTimes(1)
  })
})
