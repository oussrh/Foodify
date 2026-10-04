// lib/capture.ts
// A dish filmed and turned into its AR models (prisma/capture.prisma): the engine's stages in a
// manager's words, the summary kept from its report, the job as the dish form sees it, and the
// logo the model's underside is given.
import type { EngineReport, EngineStatus } from '@/lib/schemas/capture'

/** The engine's stages, in order, as engine/pipeline.py names them. */
export const CAPTURE_STAGES = [
  { key: 'frames', label: 'Choosing the sharpest frames' },
  { key: 'sparse', label: 'Working out where each frame was filmed from' },
  { key: 'dense', label: 'Measuring the dish in depth' },
  { key: 'align', label: 'Finding the plate and its real size' },
  { key: 'mesh_texture_export', label: 'Building the model and its colours' },
] as const

/** Where a capture stands (prisma/capture.prisma's CaptureStatus). */
export type CaptureStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ACCEPTED' | 'DISCARDED'
/** What goes on the model's underside (prisma/capture.prisma's CaptureBase). */
export type CaptureBase = 'LOGO' | 'NAME' | 'PLAIN'

/** Where a processing job is: step 0 is waiting for the engine to pick it up. */
export type CaptureProgress = { step: number; of: number; label: string }

/** Size, triangles, file sizes and time, kept from the engine's report. */
export type CaptureSummary = {
  sizeCm: { width: number; height: number; depth: number }
  triangles: number
  glbMb: number
  usdzMb: number
  seconds: number | null
}

/** A capture as the dish form shows it. */
export type CaptureView = {
  id: string
  status: CaptureStatus
  progress: CaptureProgress | null
  warnings: string[]
  error: string | null
  plateCm: string
  base: CaptureBase
  summary: CaptureSummary | null
  /** A signed address of the model, for the 3D preview, while it waits to be accepted. */
  previewUrl: string | null
  createdAt: string
}

/** The progress of a processing job at `stage` (null or unknown: waiting for the engine). */
export function captureProgress(stage: string | null): CaptureProgress {
  const index = CAPTURE_STAGES.findIndex((s) => s.key === stage)
  const found = CAPTURE_STAGES[index]
  const of = CAPTURE_STAGES.length
  return found ? { step: index + 1, of, label: found.label } : { step: 0, of, label: 'Waiting for the engine' }
}

/** What a job's row becomes once the engine has said where it is (`now` stamps a finish). */
export type CaptureUpdate = {
  status: CaptureStatus
  stage: string | null
  warnings?: string[]
  error?: string
  summary?: CaptureSummary
  finishedAt?: Date
}

/** The row's new state from the engine's answer about a job Foodify has started. */
export function captureUpdate(engine: EngineStatus, now: Date): CaptureUpdate {
  const warnings = engine.report?.warnings ?? []
  if (engine.state === 'queued' || engine.state === 'running') return { status: 'PROCESSING', stage: engine.stage }
  if (engine.state === 'done' && engine.report) {
    const summary = captureSummary(engine.report)
    return { status: 'READY', stage: null, warnings, finishedAt: now, ...(summary ? { summary } : {}) }
  }
  if (engine.state === 'failed') return { status: 'FAILED', stage: null, warnings, error: captureError(engine.report), finishedAt: now }
  // Started here, yet the engine has no record of it running: its jobs folder was cleared.
  return { status: 'FAILED', stage: null, warnings, error: 'The engine no longer has this video. Film the dish again.', finishedAt: now }
}

/** What Foodify keeps of a finished report: null when the engine made no model. */
export function captureSummary(report: EngineReport): CaptureSummary | null {
  if (!report.asset) return null
  const { size_cm: sizeCm, triangles, glb_mb: glbMb, usdz_mb: usdzMb } = report.asset
  return { sizeCm, triangles, glbMb, usdzMb, seconds: report.seconds?.total ?? null }
}

/** Why a job failed, in one line: the last line of the engine's error, without a traceback. */
export function captureError(report: EngineReport | null): string {
  const lines = (report?.error ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.at(-1) ?? 'The engine could not make a model from this video.'
}

/**
 * The logo the engine can draw on the model's underside: PNG or JPEG only. A Cloudinary image is
 * asked for as PNG (an SVG logo there becomes a PNG); a raw upload cannot be converted, and an SVG
 * elsewhere cannot be read, so those give null and the engine writes the restaurant's name instead.
 */
export function engineLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null
  const cloudinary = logoUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/)
  if (cloudinary) return `${cloudinary[1]}f_png/${cloudinary[2]}`
  return /^https:\/\/\S+\.(png|jpe?g)(\?\S*)?$/i.test(logoUrl) ? logoUrl : null
}
