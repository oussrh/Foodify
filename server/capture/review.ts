// server/capture/review.ts
// What a manager does with a finished capture: accept it, which copies its GLB and USDZ into the
// restaurant's Cloudinary folder and onto the dish, or put it aside. Scoped by the restaurant the
// caller was guarded on, like server/capture/jobs.ts. Accepting takes minutes (two downloads, two
// uploads), so its write is a claim: the dish changes only if the capture is still READY at that
// moment, so a discard or a second Accept meanwhile is never overridden.
import prisma from '@/lib/prisma'
import { uploadArFile } from '@/lib/cloudinary'
import { log } from '@/server/log'
import { CaptureEngineError, engineFile } from './engine'
import { GONE, MOVED_ON, type CaptureOutcome } from './outcome'

/** The models fetched from the engine and stored in the restaurant's folder, or why not. */
async function storeModels(restaurantId: string, jobId: string): Promise<CaptureOutcome<{ glbUrl: string; usdzUrl: string }>> {
  try {
    const [glb, usdz] = await Promise.all([engineFile(jobId, 'dish.glb'), engineFile(jobId, 'dish.usdz')])
    const [glbUrl, usdzUrl] = await Promise.all([uploadArFile(glb, 'glb', restaurantId), uploadArFile(usdz, 'usdz', restaurantId)])
    return { ok: true, glbUrl, usdzUrl }
  } catch (error) {
    log.warn({ err: error, jobId }, 'capture: not accepted')
    const reason = error instanceof CaptureEngineError ? error.message : 'The models could not be stored'
    return { ok: false, error: `${reason}. The dish was not changed; try again.` }
  }
}

/**
 * Puts a finished capture on the dish: its models are fetched from the engine, stored in the
 * restaurant's folder, and set as the dish's glbUrl and usdzUrl, which go live on the menu at once.
 */
export async function acceptCapture(restaurantId: string, jobId: string): Promise<CaptureOutcome<{ glbUrl: string; usdzUrl: string }>> {
  const job = await prisma.captureJob.findFirst({ where: { id: jobId, restaurantId }, select: { status: true, dishId: true } })
  if (!job) return GONE
  if (job.status !== 'READY') return { ok: false, error: 'Only a finished model can be accepted.' }
  const stored = await storeModels(restaurantId, jobId)
  if (!stored.ok) return stored
  const { glbUrl, usdzUrl } = stored
  const claimed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.captureJob.updateMany({ where: { id: jobId, restaurantId, status: 'READY' }, data: { status: 'ACCEPTED' } })
    if (count !== 1) return false
    await tx.dish.update({ where: { id: job.dishId }, data: { glbUrl, usdzUrl }, select: { id: true } })
    return true
  })
  return claimed ? { ok: true, glbUrl, usdzUrl } : MOVED_ON
}

/** Puts a capture aside (a reshoot, a model nobody wanted, or one the engine never finished). An accepted one stays accepted. */
export async function discardCapture(restaurantId: string, jobId: string): Promise<CaptureOutcome<object>> {
  const { count } = await prisma.captureJob.updateMany({ where: { id: jobId, restaurantId, status: { not: 'ACCEPTED' } }, data: { status: 'DISCARDED' } })
  return count === 1 ? { ok: true } : GONE
}
