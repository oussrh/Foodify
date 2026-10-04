import { beforeEach, describe, expect, it, vi } from 'vitest'

// The database, the engine and the logger are stood in for: this is the decision logic (what is
// refused, what the engine is told, what a row becomes). tests/integration/capture.test.ts runs the
// same calls on a real Postgres, behind the actions' guards.
const { db, engine, configured, log } = vi.hoisted(() => {
  class CaptureEngineError extends Error {}
  const captureJob = { findFirst: vi.fn(), count: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() }
  const client = { restaurant: { findUniqueOrThrow: vi.fn() }, captureJob, $transaction: vi.fn() }
  return {
    db: client,
    engine: {
      CaptureEngineError,
      startEngineJob: vi.fn(),
      engineJobStatus: vi.fn(),
      signedEngineUrl: vi.fn((m: string, p: string, _ttl: number, o: { name?: string } = {}) => `http://engine${p}?${m}${o.name ? `&name=${o.name}` : ''}`),
    },
    configured: { current: { url: 'http://engine', secret: 's'.repeat(40) } as object | null },
    log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
  }
})
vi.mock('@/lib/prisma', () => ({ default: db }))
vi.mock('@/lib/env', () => ({
  serverEnv: {
    get captureEngine() {
      return configured.current
    },
  },
}))
vi.mock('./engine', () => engine)
vi.mock('@/server/log', () => ({ log }))

import { Prisma } from '@/generated/prisma/client'
import { createCapture, dishCaptureState, refreshCapture, startCapture } from './jobs'

const LOGO = 'https://res.cloudinary.com/demo/image/upload/v1/logo.svg'
const row = (over: object = {}) => ({
  id: 'job-1', status: 'UPLOADING', stage: null, warnings: [], error: null, plateCm: new Prisma.Decimal('24'),
  base: 'LOGO', summary: null, createdAt: new Date('2026-10-03T20:00:00Z'), restaurant: { name: 'Chez Test', logoUrl: LOGO }, ...over,
})
const request = { dishId: 'dish-1', plateCm: 24, base: 'LOGO' as const, video: { name: 'IMG_1.MOV', size: 10 }, photos: [{ name: 'IMG_2.JPG', size: 5 }, { name: 'top.png', size: 5 }] }

beforeEach(() => {
  vi.clearAllMocks()
  configured.current = { url: 'http://engine', secret: 's'.repeat(40) }
  db.$transaction.mockImplementation((work: (tx: typeof db) => unknown) => work(db))
})

describe('dishCaptureState', () => {
  it('is off, reading nothing, when no engine is configured', async () => {
    configured.current = null
    expect(await dishCaptureState('r1', 'dish-1')).toEqual({ enabled: false })
    expect(db.captureJob.findFirst).not.toHaveBeenCalled()
  })

  it("gives the restaurant's name, whether its logo is usable, the last plate size and the open capture", async () => {
    db.restaurant.findUniqueOrThrow.mockResolvedValue({ name: 'Chez Test', logoUrl: LOGO })
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'PROCESSING', stage: 'frames' })).mockResolvedValueOnce({ plateCm: new Prisma.Decimal('24.5') })
    expect(await dishCaptureState('r1', 'dish-1')).toMatchObject({ enabled: true, restaurantName: 'Chez Test', hasLogo: true, lastPlateCm: 24.5, job: { status: 'PROCESSING' } })
  })

  it('has no plate size and no capture for a first time, and no logo for one it cannot read', async () => {
    db.restaurant.findUniqueOrThrow.mockResolvedValue({ name: 'Chez Test', logoUrl: 'https://x.example/logo.svg' })
    db.captureJob.findFirst.mockResolvedValue(null)
    expect(await dishCaptureState('r1', 'dish-1')).toEqual({ enabled: true, restaurantName: 'Chez Test', hasLogo: false, lastPlateCm: null, job: null })
  })
})

describe('createCapture', () => {
  it('is refused when no engine is configured', async () => {
    configured.current = null
    expect(await createCapture('r1', request)).toEqual({ ok: false, error: 'Creating models from a video is not set up on this server.' })
  })

  it('is refused while another capture of the dish is processing', async () => {
    db.captureJob.count.mockResolvedValue(1)
    expect(await createCapture('r1', request)).toMatchObject({ ok: false, error: expect.stringContaining('still being processed') })
    expect(db.captureJob.create).not.toHaveBeenCalled()
  })

  it('puts earlier unfinished captures aside, and signs one upload per file, named as the engine stores it', async () => {
    db.captureJob.count.mockResolvedValue(0)
    db.captureJob.create.mockResolvedValue({ id: 'job-2' })
    const url = 'http://engine/jobs/job-2/source?PUT'
    expect(await createCapture('r1', request)).toEqual({ ok: true, jobId: 'job-2', uploads: [`${url}&name=capture.mov`, `${url}&name=still_1.jpg`, `${url}&name=still_2.png`] })
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({ where: { restaurantId: 'r1', dishId: 'dish-1', status: { in: ['UPLOADING', 'READY', 'FAILED'] } }, data: { status: 'DISCARDED' } })
    expect(engine.signedEngineUrl).toHaveBeenCalledWith('PUT', '/jobs/job-2/source', 7200, { name: 'still_2.png' })
  })
})

/** The row as the test's conditional write left it, read back by `current`. */
const readBack = (over: object) => db.captureJob.findFirst.mockResolvedValueOnce(row(over))

describe('startCapture', () => {
  it('reads a capture of another restaurant as gone', async () => {
    db.captureJob.findFirst.mockResolvedValue(null)
    expect(await startCapture('r1', 'job-1')).toEqual({ ok: false, error: 'That capture is no longer here. Refresh the page.' })
  })

  it('tells the engine the plate, the name and the logo as a PNG, then marks it processing if it is still uploading', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(row())
    db.captureJob.updateMany.mockResolvedValue({ count: 1 })
    readBack({ status: 'PROCESSING' })
    expect(await startCapture('r1', 'job-1')).toMatchObject({ ok: true, job: { status: 'PROCESSING' } })
    expect(engine.startEngineJob).toHaveBeenCalledWith('job-1', { plate_cm: 24, base_text: 'Chez Test', base_logo: 'https://res.cloudinary.com/demo/image/upload/f_png/v1/logo.svg' })
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({ where: { id: 'job-1', restaurantId: 'r1', status: 'UPLOADING' }, data: { status: 'PROCESSING' } })
  })

  it('leaves a capture put aside while the engine was being told put aside, and says so', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(row())
    db.captureJob.updateMany.mockResolvedValue({ count: 0 })
    expect(await startCapture('r1', 'job-1')).toEqual({ ok: false, error: expect.stringContaining('changed meanwhile') })
  })

  it('sends the name alone when the logo cannot be read or the name was chosen, and nothing for a plain base', async () => {
    db.captureJob.updateMany.mockResolvedValue({ count: 1 })
    db.captureJob.findFirst.mockResolvedValueOnce(row({ restaurant: { name: 'Chez Test', logoUrl: null } }))
    readBack({ status: 'PROCESSING' })
    await startCapture('r1', 'job-1')
    db.captureJob.findFirst.mockResolvedValueOnce(row({ base: 'NAME' }))
    readBack({ status: 'PROCESSING' })
    await startCapture('r1', 'job-1')
    db.captureJob.findFirst.mockResolvedValueOnce(row({ base: 'PLAIN' }))
    readBack({ status: 'PROCESSING' })
    await startCapture('r1', 'job-1')
    expect(engine.startEngineJob.mock.calls.map((call) => call[1])).toEqual([
      { plate_cm: 24, base_text: 'Chez Test' },
      { plate_cm: 24, base_text: 'Chez Test' },
      { plate_cm: 24 },
    ])
  })

  it('changes nothing for a capture already started', async () => {
    db.captureJob.findFirst.mockResolvedValue(row({ status: 'READY' }))
    expect(await startCapture('r1', 'job-1')).toMatchObject({ ok: true, job: { status: 'READY' } })
    expect(engine.startEngineJob).not.toHaveBeenCalled()
  })

  it('stays uploading and says why when the engine refuses, and lets any other failure through', async () => {
    db.captureJob.findFirst.mockResolvedValue(row())
    engine.startEngineJob.mockRejectedValueOnce(new engine.CaptureEngineError('The capture engine answered 409 to POST /jobs/job-1/start'))
    expect(await startCapture('r1', 'job-1')).toEqual({ ok: false, error: 'The capture engine answered 409 to POST /jobs/job-1/start. Try starting it again in a moment.' })
    expect(db.captureJob.updateMany).not.toHaveBeenCalled()
    engine.startEngineJob.mockRejectedValueOnce(new TypeError('bug'))
    await expect(startCapture('r1', 'job-1')).rejects.toThrow('bug')
  })
})

describe('refreshCapture', () => {
  it('reads a capture of another restaurant as gone, and asks the engine nothing about a settled one', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(null)
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: false })
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'READY' }))
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: true, offline: false, job: { status: 'READY' } })
    expect(engine.engineJobStatus).not.toHaveBeenCalled()
  })

  it('writes what the engine says onto the capture only while it is still processing, then reads it back', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'PROCESSING' }))
    engine.engineJobStatus.mockResolvedValue({ state: 'running', stage: 'align', report: null })
    readBack({ status: 'PROCESSING', stage: 'align' })
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: true, offline: false, job: { progress: { step: 4 } } })
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({ where: { id: 'job-1', restaurantId: 'r1', status: 'PROCESSING' }, data: { status: 'PROCESSING', stage: 'align' } })
  })

  it('shows a capture put aside during the poll as put aside, not as what the engine said', async () => {
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'PROCESSING' }))
    engine.engineJobStatus.mockResolvedValue({ state: 'done', stage: null, report: { status: 'ok', warnings: [] } })
    db.captureJob.updateMany.mockResolvedValue({ count: 0 })
    readBack({ status: 'DISCARDED' })
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: true, job: { status: 'DISCARDED' } })
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'PROCESSING' })).mockResolvedValueOnce(null)
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: false })
  })

  it('keeps the capture as it was, offline, when the engine does not answer, and lets any other failure through', async () => {
    db.captureJob.findFirst.mockResolvedValue(row({ status: 'PROCESSING', stage: 'dense', createdAt: new Date() }))
    engine.engineJobStatus.mockRejectedValueOnce(new engine.CaptureEngineError('down'))
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: true, offline: true, job: { progress: { step: 3 } } })
    expect(log.warn).toHaveBeenCalledOnce()
    expect(db.captureJob.updateMany).not.toHaveBeenCalled()
    engine.engineJobStatus.mockRejectedValueOnce(new TypeError('bug'))
    await expect(refreshCapture('r1', 'job-1')).rejects.toThrow('bug')
  })

  it('fails a capture the engine has said nothing about for three hours, with the reason', async () => {
    const started = new Date(Date.now() - 3 * 3600 * 1000 - 1000)
    db.captureJob.findFirst.mockResolvedValueOnce(row({ status: 'PROCESSING', createdAt: started }))
    engine.engineJobStatus.mockRejectedValueOnce(new engine.CaptureEngineError('down'))
    readBack({ status: 'FAILED', error: 'The engine did not report on this capture for three hours. Film the dish again.' })
    expect(await refreshCapture('r1', 'job-1')).toMatchObject({ ok: true, offline: true, job: { status: 'FAILED' } })
    expect(db.captureJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', restaurantId: 'r1', status: 'PROCESSING' },
      data: { status: 'FAILED', stage: null, error: 'The engine did not report on this capture for three hours. Film the dish again.', finishedAt: expect.any(Date) },
    })
  })
})
