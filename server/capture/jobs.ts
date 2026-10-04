// server/capture/jobs.ts
// A dish's captures, from the dish form: what its AR section starts from, starting one (the
// browser then sends the video and photos straight to the engine), telling the engine to begin,
// and asking it where things are. Every call is scoped by the restaurant the caller was guarded on,
// so a job id from another restaurant reads as gone. Every status change is a conditional write
// (`updateMany` on the status it was read in), so a capture changed meanwhile by another tab, a
// discard or a crossing poll is never moved back. Accepting and discarding are review.ts.
import prisma from '@/lib/prisma'
import { serverEnv } from '@/lib/env'
import { captureUpdate, engineLogoUrl, type CaptureView } from '@/lib/capture'
import type { CaptureMode, CaptureRequest } from '@/lib/schemas/capture'
import { log } from '@/server/log'
import { CaptureEngineError, engineJobStatus, signedEngineUrl, startEngineJob, type EngineParams } from './engine'
import { GONE, MOVED_ON, type CaptureOutcome } from './outcome'
import { captureSelect, captureView } from './view'

/** How long each file's upload address works: a large video on a slow connection takes a while. */
const UPLOAD_SECONDS = 2 * 3600
/** A capture the engine has said nothing about for this long is failed rather than awaited forever. */
const SILENT_LIMIT_MS = 3 * 3600 * 1000
const OFF = { ok: false, error: 'Creating models from a video is not set up on this server.' } as const

/** What a dish's AR section needs: whether capture is on, the restaurant's mark, the last plate and filming mode, and the open job. */
export async function dishCaptureState(restaurantId: string, dishId: string) {
  if (!serverEnv.captureEngine) return { enabled: false as const }
  const [restaurant, open, last] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { name: true, logoUrl: true } }),
    prisma.captureJob.findFirst({ where: { restaurantId, dishId, status: { notIn: ['ACCEPTED', 'DISCARDED'] } }, orderBy: { createdAt: 'desc' }, select: captureSelect }),
    prisma.captureJob.findFirst({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, select: { plateCm: true, mode: true } }),
  ])
  return {
    enabled: true as const,
    restaurantName: restaurant.name,
    hasLogo: engineLogoUrl(restaurant.logoUrl) !== null,
    lastPlateCm: last ? last.plateCm.toNumber() : null,
    lastMode: last ? last.mode : null,
    job: open ? captureView(open) : null,
  }
}

/** The file's extension, lower case, with its dot. */
const extension = (name: string) => name.slice(name.lastIndexOf('.')).toLowerCase()

/**
 * A new capture for the dish, and where the browser sends each file: the video, then the photos in
 * the order given, each on its own address that names the file as the engine stores it
 * (capture.<ext>, still_<n>.<ext>) and is signed for that name only. Earlier captures not yet
 * accepted are put aside; one still processing is let finish (or put aside) first.
 */
export async function createCapture(restaurantId: string, request: CaptureRequest): Promise<CaptureOutcome<{ jobId: string; uploads: string[] }>> {
  if (!serverEnv.captureEngine) return OFF
  const where = { restaurantId, dishId: request.dishId }
  if (await prisma.captureJob.count({ where: { ...where, status: 'PROCESSING' } })) {
    return { ok: false, error: 'A video of this dish is still being processed. Wait for it, or put it aside first.' }
  }
  const job = await prisma.$transaction(async (tx) => {
    await tx.captureJob.updateMany({ where: { ...where, status: { in: ['UPLOADING', 'READY', 'FAILED'] } }, data: { status: 'DISCARDED' } })
    return tx.captureJob.create({ data: { ...where, plateCm: request.plateCm, base: request.base, mode: request.mode }, select: { id: true } })
  })
  const names = [`capture${extension(request.video.name)}`, ...request.photos.map((photo, i) => `still_${i + 1}${extension(photo.name)}`)]
  const uploads = names.map((name) => signedEngineUrl('PUT', `/jobs/${job.id}/source`, UPLOAD_SECONDS, { name }))
  return { ok: true, jobId: job.id, uploads }
}

/** How the dish was filmed, and what the engine is asked to draw underneath: the logo (if it can read it) or the name, or nothing. */
function engineParams(job: { plateCm: { toNumber(): number }; base: string; mode: CaptureMode; restaurant: { name: string; logoUrl: string | null } }): EngineParams {
  const params: EngineParams = { plate_cm: job.plateCm.toNumber(), mode: job.mode === 'TURNTABLE' ? 'turntable' : 'walkaround' }
  if (job.base === 'PLAIN') return params
  const logo = job.base === 'LOGO' ? engineLogoUrl(job.restaurant.logoUrl) : null
  return { ...params, base_text: job.restaurant.name, ...(logo ? { base_logo: logo } : {}) }
}

/** The job as it now stands, read back after a write. */
async function current(restaurantId: string, jobId: string): Promise<CaptureOutcome<{ job: CaptureView }>> {
  const row = await prisma.captureJob.findFirst({ where: { id: jobId, restaurantId }, select: captureSelect })
  return row ? { ok: true, job: captureView(row) } : GONE
}

/**
 * Tells the engine to begin, once the browser has sent the files. Starting twice changes nothing,
 * and a capture put aside while the engine was being told stays put aside.
 */
export async function startCapture(restaurantId: string, jobId: string): Promise<CaptureOutcome<{ job: CaptureView }>> {
  const job = await prisma.captureJob.findFirst({
    where: { id: jobId, restaurantId },
    select: { ...captureSelect, mode: true, restaurant: { select: { name: true, logoUrl: true } } },
  })
  if (!job) return GONE
  if (job.status !== 'UPLOADING') return { ok: true, job: captureView(job) }
  try {
    await startEngineJob(jobId, engineParams(job))
  } catch (error) {
    if (!(error instanceof CaptureEngineError)) throw error
    log.warn({ err: error, jobId }, 'capture: not started')
    return { ok: false, error: `${error.message}. Try starting it again in a moment.` }
  }
  const { count } = await prisma.captureJob.updateMany({ where: { id: jobId, restaurantId, status: 'UPLOADING' }, data: { status: 'PROCESSING' } })
  return count === 1 ? current(restaurantId, jobId) : MOVED_ON
}

/**
 * The job as it stands, asking the engine first while it is processing. An engine that does not
 * answer leaves the job as it was and says so (`offline`), so the page keeps asking, for three
 * hours at most; after that the job is failed with the reason.
 */
export async function refreshCapture(restaurantId: string, jobId: string): Promise<CaptureOutcome<{ job: CaptureView; offline: boolean }>> {
  const row = await prisma.captureJob.findFirst({ where: { id: jobId, restaurantId }, select: captureSelect })
  if (!row) return GONE
  if (row.status !== 'PROCESSING') return { ok: true, job: captureView(row), offline: false }
  let data: object
  let offline = false
  try {
    data = captureUpdate(await engineJobStatus(jobId), new Date())
  } catch (error) {
    if (!(error instanceof CaptureEngineError)) throw error
    log.warn({ err: error, jobId }, 'capture: engine not answering')
    if (Date.now() - row.createdAt.getTime() < SILENT_LIMIT_MS) return { ok: true, job: captureView(row), offline: true }
    data = { status: 'FAILED', stage: null, error: 'The engine did not report on this capture for three hours. Film the dish again.', finishedAt: new Date() }
    offline = true
  }
  await prisma.captureJob.updateMany({ where: { id: jobId, restaurantId, status: 'PROCESSING' }, data })
  const now = await current(restaurantId, jobId)
  return now.ok ? { ...now, offline } : now
}
