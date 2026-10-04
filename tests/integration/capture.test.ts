import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// "Create from a video" on the real database: the guards, a capture's life from created to
// accepted, and what lands on the dish. The engine and Cloudinary are stood in for (their sides are
// server/capture/engine.test.ts and services/capture-engine's own tests); the rows are real.
vi.mock('@/server/capture/engine', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/server/capture/engine')>()
  return { ...real, startEngineJob: vi.fn(), engineJobStatus: vi.fn(), engineFile: vi.fn() }
})
vi.mock('@/lib/cloudinary', () => ({
  uploadArFile: vi.fn(async (_bytes: Uint8Array, kind: string, restaurantId: string) => `https://res.cloudinary.com/demo/raw/upload/restaurants/${restaurantId}/ar/${kind}_1.${kind}`),
}))

import { createCapture, getDishCapture, refreshCapture, startCapture } from '@/app/actions/capture-actions'
import { acceptCapture, discardCapture } from '@/app/actions/capture-review-actions'
import { uploadArFile } from '@/lib/cloudinary'
import { engineReport } from '@/lib/schemas/capture'
import { CaptureEngineError, engineFile, engineJobStatus, startEngineJob } from '@/server/capture/engine'
import { withRollback, type Tx } from './db'
import { dish, manager, restaurant } from './fixtures'
import { signInAs } from './session'

vi.stubEnv('CAPTURE_ENGINE_URL', 'http://engine.test')
vi.stubEnv('CAPTURE_ENGINE_SECRET', 'e'.repeat(40))
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => vi.clearAllMocks())

const forbidden = { status: 403 }
const video = { name: 'IMG_0042.MOV', size: 400_000_000 }
const LOGO = 'https://res.cloudinary.com/demo/image/upload/v1/restaurants/x/branding/logo.svg'

/** A restaurant with a logo, one dish, and its manager signed in. */
async function kitchen(tx: Tx) {
  const place = await restaurant(tx, 'Chez Test')
  await tx.restaurant.update({ where: { id: place.id }, data: { logoUrl: LOGO } })
  const plate = await dish(tx, place.id)
  const owner = await manager(tx, [place.id])
  signInAs(owner)
  return { place, plate }
}

/** A capture created and started, as the dish form leaves it once the video is sent. */
async function processing(dishId: string, plateCm = 24) {
  const created = await createCapture({ dishId, plateCm, base: 'LOGO', mode: 'TURNTABLE', video, photos: [] })
  if (!created.ok) throw new Error(created.error)
  await startCapture(created.jobId)
  return created.jobId
}

describe('the guards', () => {
  it("refuses another restaurant's manager the dish and every one of its captures", () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      const other = await restaurant(tx)
      signInAs(await manager(tx, [other.id]))
      await expect(getDishCapture(plate.id)).rejects.toMatchObject(forbidden)
      await expect(createCapture({ dishId: plate.id, plateCm: 27, base: 'NAME', mode: 'WALKAROUND', video, photos: [] })).rejects.toMatchObject(forbidden)
      for (const action of [startCapture, refreshCapture, acceptCapture, discardCapture]) {
        await expect(action(jobId)).rejects.toMatchObject(forbidden)
      }
      await expect(refreshCapture('0b3c6f1e-6a7d-4d2f-9a51-2f8e1c4b7a90')).rejects.toMatchObject(forbidden)
    }))
})

describe('a capture from start to the dish', () => {
  it('opens on a dish with the restaurant name, its logo usable, and the last plate size and filming mode remembered', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      expect(await getDishCapture(plate.id)).toEqual({ enabled: true, restaurantName: 'Chez Test', hasLogo: true, lastPlateCm: null, lastMode: null, job: null })
      await processing(plate.id, 24.5)
      expect(await getDishCapture(plate.id)).toMatchObject({ lastPlateCm: 24.5, lastMode: 'TURNTABLE', job: { status: 'PROCESSING', plateCm: '24.5' } })
    }))

  it('signs an upload address per file for that job only, and puts earlier unfinished captures aside', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const first = await createCapture({ dishId: plate.id, plateCm: 27, base: 'NAME', mode: 'WALKAROUND', video, photos: [] })
      const photos = [{ name: 'IMG_7.JPG', size: 10 }, { name: 'top.png', size: 10 }]
      const second = await createCapture({ dishId: plate.id, plateCm: 27, base: 'NAME', mode: 'WALKAROUND', video: { name: 'clip.mp4', size: 10 }, photos })
      if (!first.ok || !second.ok) throw new Error('not created')
      const urls = second.uploads.map((u) => new URL(u))
      expect(urls.map((u) => u.origin + u.pathname)).toEqual(Array(3).fill(`http://engine.test/jobs/${second.jobId}/source`))
      expect(urls.map((u) => u.searchParams.get('name'))).toEqual(['capture.mp4', 'still_1.jpg', 'still_2.png'])
      expect(urls[0]?.searchParams.get('sig')).toMatch(/^[0-9a-f]{64}$/)
      expect((await tx.captureJob.findUniqueOrThrow({ where: { id: first.jobId } })).status).toBe('DISCARDED')
      expect((await tx.captureJob.findUniqueOrThrow({ where: { id: second.jobId } })).status).toBe('UPLOADING')
    }))

  it('tells the engine the plate, how it was filmed, the name and the logo as a PNG, once, and refuses a new capture meanwhile', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      expect(startEngineJob).toHaveBeenCalledExactlyOnceWith(jobId, {
        plate_cm: 24,
        mode: 'turntable',
        base_text: 'Chez Test',
        base_logo: 'https://res.cloudinary.com/demo/image/upload/f_png/v1/restaurants/x/branding/logo.svg',
      })
      expect(await startCapture(jobId)).toMatchObject({ ok: true, job: { status: 'PROCESSING' } })
      expect(startEngineJob).toHaveBeenCalledOnce()
      expect(await createCapture({ dishId: plate.id, plateCm: 27, base: 'PLAIN', mode: 'WALKAROUND', video, photos: [] })).toMatchObject({ ok: false })
    }))

  it('stays uploading, and says why, when the engine refuses to start', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      vi.mocked(startEngineJob).mockRejectedValueOnce(new CaptureEngineError('The capture engine did not answer (TimeoutError)'))
      const created = await createCapture({ dishId: plate.id, plateCm: 27, base: 'PLAIN', mode: 'WALKAROUND', video, photos: [] })
      if (!created.ok) throw new Error(created.error)
      expect(await startCapture(created.jobId)).toEqual({ ok: false, error: 'The capture engine did not answer (TimeoutError). Try starting it again in a moment.' })
      expect((await tx.captureJob.findUniqueOrThrow({ where: { id: created.jobId } })).status).toBe('UPLOADING')
    }))

  it('follows the engine while it works, keeps the job as it was while it does not answer, then offers the model', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      vi.mocked(engineJobStatus).mockResolvedValueOnce({ state: 'running', stage: 'dense', report: null })
      expect(await refreshCapture(jobId)).toMatchObject({ ok: true, offline: false, job: { progress: { step: 3 } } })
      vi.mocked(engineJobStatus).mockRejectedValueOnce(new CaptureEngineError('down'))
      expect(await refreshCapture(jobId)).toMatchObject({ ok: true, offline: true, job: { status: 'PROCESSING', progress: { step: 3 } } })
      const asset = { size_cm: { width: 24.1, height: 5.6, depth: 24 }, triangles: 50_000, glb_mb: 3.2, usdz_mb: 3 }
      const report = engineReport.parse({ status: 'ok', warnings: ['short capture'], asset, seconds: { total: 700 } })
      vi.mocked(engineJobStatus).mockResolvedValueOnce({ state: 'done', stage: null, report })
      const ready = await refreshCapture(jobId)
      expect(ready).toMatchObject({ ok: true, job: { status: 'READY', warnings: ['short capture'], summary: { glbMb: 3.2 } } })
      expect(ready.ok && ready.job.previewUrl).toContain(`http://engine.test/jobs/${jobId}/files/dish.glb?exp=`)
    }))

  it('puts an accepted model on the dish, from the engine through Cloudinary, and only a finished one', () =>
    withRollback(async (tx) => {
      const { place, plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      expect(await acceptCapture(jobId)).toEqual({ ok: false, error: 'Only a finished model can be accepted.' })
      await tx.captureJob.update({ where: { id: jobId }, data: { status: 'READY' } })
      vi.mocked(engineFile).mockResolvedValue(new Uint8Array([1, 2, 3]))
      const accepted = await acceptCapture(jobId)
      const glbUrl = `https://res.cloudinary.com/demo/raw/upload/restaurants/${place.id}/ar/glb_1.glb`
      expect(accepted).toEqual({ ok: true, glbUrl, usdzUrl: glbUrl.replaceAll('glb', 'usdz') })
      expect(uploadArFile).toHaveBeenCalledTimes(2)
      expect(await tx.dish.findUniqueOrThrow({ where: { id: plate.id }, select: { glbUrl: true } })).toEqual({ glbUrl })
      expect(await discardCapture(jobId)).toMatchObject({ ok: false })
      expect((await tx.captureJob.findUniqueOrThrow({ where: { id: jobId } })).status).toBe('ACCEPTED')
    }))

  it('changes nothing on the dish when the models cannot be fetched or stored', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      await tx.captureJob.update({ where: { id: jobId }, data: { status: 'READY' } })
      vi.mocked(engineFile).mockRejectedValueOnce(new CaptureEngineError('The capture engine answered 404 to GET /x'))
      expect(await acceptCapture(jobId)).toEqual({ ok: false, error: 'The capture engine answered 404 to GET /x. The dish was not changed; try again.' })
      vi.mocked(engineFile).mockResolvedValue(new Uint8Array([1]))
      vi.mocked(uploadArFile).mockRejectedValueOnce(new Error('Cloudinary environment variables are not set'))
      expect(await acceptCapture(jobId)).toEqual({ ok: false, error: 'The models could not be stored. The dish was not changed; try again.' })
      expect(await tx.dish.findUniqueOrThrow({ where: { id: plate.id }, select: { glbUrl: true } })).toEqual({ glbUrl: '' })
    }))
})

// Another tab puts the capture aside at the worst moment of each long call. The put-aside wins
// every time: nothing a slower call writes afterwards brings the capture back or changes the dish.
describe('a capture put aside while another call is in flight', () => {
  const statusOf = async (tx: Tx, id: string) => (await tx.captureJob.findUniqueOrThrow({ where: { id } })).status

  it('stays aside, and the dish keeps its model, when it is put aside while Accept stores the files', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      await tx.captureJob.update({ where: { id: jobId }, data: { status: 'READY' } })
      vi.mocked(engineFile).mockImplementation(async () => {
        await discardCapture(jobId)
        return new Uint8Array([1])
      })
      expect(await acceptCapture(jobId)).toEqual({ ok: false, error: expect.stringContaining('changed meanwhile') })
      expect(await statusOf(tx, jobId)).toBe('DISCARDED')
      expect(await tx.dish.findUniqueOrThrow({ where: { id: plate.id }, select: { glbUrl: true } })).toEqual({ glbUrl: '' })
    }))

  it('stays aside when it is put aside while the engine is being told to start', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const created = await createCapture({ dishId: plate.id, plateCm: 27, base: 'PLAIN', mode: 'WALKAROUND', video, photos: [] })
      if (!created.ok) throw new Error(created.error)
      vi.mocked(startEngineJob).mockImplementationOnce(async () => {
        await discardCapture(created.jobId)
      })
      expect(await startCapture(created.jobId)).toEqual({ ok: false, error: expect.stringContaining('changed meanwhile') })
      expect(await statusOf(tx, created.jobId)).toBe('DISCARDED')
    }))

  it('stays aside when it is put aside while a poll asks the engine, whatever the engine says', () =>
    withRollback(async (tx) => {
      const { plate } = await kitchen(tx)
      const jobId = await processing(plate.id)
      vi.mocked(engineJobStatus).mockImplementationOnce(async () => {
        await discardCapture(jobId)
        return { state: 'done', stage: null, report: engineReport.parse({ status: 'ok' }) }
      })
      expect(await refreshCapture(jobId)).toMatchObject({ ok: true, job: { status: 'DISCARDED' } })
      expect(await statusOf(tx, jobId)).toBe('DISCARDED')
    }))
})
