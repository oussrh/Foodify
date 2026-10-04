import { beforeEach, describe, expect, it, vi } from 'vitest'

// The database, the engine, Cloudinary and the logger are stood in for: this is what Accept and
// Discard decide. tests/integration/capture.test.ts runs them on a real Postgres.
const { db, engine, uploadArFile, log } = vi.hoisted(() => {
  class CaptureEngineError extends Error {}
  return {
    db: { captureJob: { findFirst: vi.fn(), updateMany: vi.fn() }, dish: { update: vi.fn() }, $transaction: vi.fn() },
    engine: { CaptureEngineError, engineFile: vi.fn() },
    uploadArFile: vi.fn(),
    log: { warn: vi.fn() },
  }
})
vi.mock('@/lib/prisma', () => ({ default: db }))
vi.mock('@/lib/cloudinary', () => ({ uploadArFile }))
vi.mock('./engine', () => engine)
vi.mock('@/server/log', () => ({ log }))

import { acceptCapture, discardCapture } from './review'

beforeEach(() => {
  vi.clearAllMocks()
  db.$transaction.mockImplementation((work: (tx: typeof db) => unknown) => work(db))
  engine.engineFile.mockResolvedValue(new Uint8Array([1]))
  uploadArFile.mockImplementation(async (_bytes: Uint8Array, kind: string) => `https://cdn/${kind}`)
})

describe('acceptCapture', () => {
  it('reads a capture of another restaurant as gone, and refuses one not finished', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(null)
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: false, error: 'That capture is no longer here. Refresh the page.' })
    db.captureJob.findFirst.mockResolvedValueOnce({ status: 'PROCESSING', dishId: 'dish-1' })
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: false, error: 'Only a finished model can be accepted.' })
    expect(engine.engineFile).not.toHaveBeenCalled()
  })

  it('claims the capture while it is still finished, then puts both models on the dish, in one transaction', async () => {
    db.captureJob.findFirst.mockResolvedValue({ status: 'READY', dishId: 'dish-1' })
    db.captureJob.updateMany.mockResolvedValue({ count: 1 })
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: true, glbUrl: 'https://cdn/glb', usdzUrl: 'https://cdn/usdz' })
    expect(engine.engineFile.mock.calls).toEqual([['job-1', 'dish.glb'], ['job-1', 'dish.usdz']])
    expect(uploadArFile.mock.calls.map((call) => [call[1], call[2]])).toEqual([['glb', 'r1'], ['usdz', 'r1']])
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({ where: { id: 'job-1', restaurantId: 'r1', status: 'READY' }, data: { status: 'ACCEPTED' } })
    expect(db.dish.update).toHaveBeenCalledWith({ where: { id: 'dish-1' }, data: { glbUrl: 'https://cdn/glb', usdzUrl: 'https://cdn/usdz' }, select: { id: true } })
    expect(db.$transaction).toHaveBeenCalledOnce()
  })

  it('leaves the dish alone when the capture was put aside or accepted meanwhile, and says so', async () => {
    db.captureJob.findFirst.mockResolvedValue({ status: 'READY', dishId: 'dish-1' })
    db.captureJob.updateMany.mockResolvedValue({ count: 0 })
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: false, error: expect.stringContaining('changed meanwhile') })
    expect(db.dish.update).not.toHaveBeenCalled()
  })

  it("changes nothing, and says why, when the engine or Cloudinary fails", async () => {
    db.captureJob.findFirst.mockResolvedValue({ status: 'READY', dishId: 'dish-1' })
    engine.engineFile.mockRejectedValueOnce(new engine.CaptureEngineError('The capture engine did not answer (TimeoutError)'))
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: false, error: 'The capture engine did not answer (TimeoutError). The dish was not changed; try again.' })
    uploadArFile.mockRejectedValueOnce(new Error('Cloudinary environment variables are not set'))
    expect(await acceptCapture('r1', 'job-1')).toEqual({ ok: false, error: 'The models could not be stored. The dish was not changed; try again.' })
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(log.warn).toHaveBeenCalledTimes(2)
  })
})

describe('discardCapture', () => {
  it('puts a capture aside, and reads one already accepted or of another restaurant as gone', async () => {
    db.captureJob.updateMany.mockResolvedValueOnce({ count: 1 })
    expect(await discardCapture('r1', 'job-1')).toEqual({ ok: true })
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({ where: { id: 'job-1', restaurantId: 'r1', status: { not: 'ACCEPTED' } }, data: { status: 'DISCARDED' } })
    db.captureJob.updateMany.mockResolvedValueOnce({ count: 0 })
    expect(await discardCapture('r1', 'job-1')).toMatchObject({ ok: false })
  })
})
