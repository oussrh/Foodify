// server/capture/view.ts
// One reading of a capture job (`captureSelect`) and what the dish form is shown of it
// (`captureView`): the progress in words while it is processing, and a signed address of the model,
// for the 3D preview, while it waits to be accepted.
import type { Prisma } from '@/generated/prisma/client'
import { captureProgress, type CaptureView } from '@/lib/capture'
import { captureSummary } from '@/lib/schemas/capture'
import { signedEngineUrl } from './engine'

/** How long the preview's address works: long enough to look, short enough not to be shared. */
const PREVIEW_SECONDS = 3600

/** The columns a view is made from. */
export const captureSelect = {
  id: true,
  status: true,
  stage: true,
  warnings: true,
  error: true,
  plateCm: true,
  base: true,
  summary: true,
  createdAt: true,
} satisfies Prisma.CaptureJobSelect

/** A capture job read with `captureSelect`. */
export type CaptureRow = Prisma.CaptureJobGetPayload<{ select: typeof captureSelect }>

/** The job as the dish form shows it. A summary the column cannot be read as is shown as none. */
export function captureView(row: CaptureRow): CaptureView {
  const summary = captureSummary.safeParse(row.summary)
  return {
    id: row.id,
    status: row.status,
    progress: row.status === 'PROCESSING' ? captureProgress(row.stage) : null,
    warnings: row.warnings,
    error: row.error,
    plateCm: row.plateCm.toFixed(1),
    base: row.base,
    summary: summary.success ? summary.data : null,
    previewUrl: row.status === 'READY' ? signedEngineUrl('GET', `/jobs/${row.id}/files/dish.glb`, PREVIEW_SECONDS) : null,
    createdAt: row.createdAt.toISOString(),
  }
}
