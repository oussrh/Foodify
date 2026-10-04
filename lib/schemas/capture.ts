// lib/schemas/capture.ts
// A dish filmed and turned into its AR models: what the dish form sends to start one (the action
// parses it, the form validates with it), and what the capture engine answers about a job, parsed
// where it crosses into our server (server/capture/engine.ts).
import { z } from 'zod'
import { uuid } from './common'

/** The largest video the engine takes (its MAX_UPLOAD_BYTES). */
export const MAX_VIDEO_BYTES = 2 * 1024 ** 3

/** The plate's diameter in centimetres: it sets the model's real size. */
export const plateCm = z.number('Enter the plate diameter in cm').min(10, 'A plate is at least 10 cm across').max(60, 'A plate is at most 60 cm across')

/** What goes on the model's underside, which the camera never sees. */
export const captureBase = z.enum(['LOGO', 'NAME', 'PLAIN'])

/** How the dish was filmed: the phone walked round a still plate, or the plate turned in front of a still phone. */
export const captureMode = z.enum(['WALKAROUND', 'TURNTABLE'])
/** How the dish was filmed. */
export type CaptureMode = z.infer<typeof captureMode>

/** The video chosen on the phone or computer, as the browser describes it. */
export const captureVideo = z.object({
  name: z.string().regex(/\.(mp4|mov|m4v|mkv)$/i, 'Choose a video: MP4 or MOV'),
  size: z.number().int().positive('The video is empty').max(MAX_VIDEO_BYTES, 'The video is larger than 2 GB'),
})

/** At most this many photos beside the video (the engine takes up to 12). */
export const MAX_PHOTOS = 8

/** One HD photo beside the video. JPEG or PNG: the engine cannot read HEIC, an iPhone's default. */
export const capturePhoto = z.object({
  name: z
    .string()
    .refine((n) => !/\.(heic|heif)$/i.test(n), 'HEIC photos cannot be read: on iPhone, Settings → Camera → Formats → Most Compatible')
    .refine((n) => /\.(jpe?g|png)$/i.test(n), 'Photos must be JPEG or PNG'),
  size: z.number().int().positive('A photo is empty').max(50 * 1024 ** 2, 'A photo is larger than 50 MB'),
})

/** Starting a capture for a dish: the video, and the photos taken with it. */
export const captureRequest = z
  .object({
    dishId: uuid,
    plateCm,
    base: captureBase,
    mode: captureMode,
    video: captureVideo,
    photos: z.array(capturePhoto).max(MAX_PHOTOS, `At most ${MAX_PHOTOS} photos`),
  })
  .refine((r) => r.video.size + r.photos.reduce((sum, p) => sum + p.size, 0) <= MAX_VIDEO_BYTES, {
    message: 'The video and photos come to more than 2 GB',
    path: ['photos'],
  })
/** Starting a capture, as the form sends it. */
export type CaptureRequest = z.infer<typeof captureRequest>

const sizeCm = z.object({ width: z.number(), height: z.number(), depth: z.number() })

/** The summary Foodify stored from a report (CaptureJob.summary), read back from the JSON column. */
export const captureSummary = z.object({
  sizeCm,
  triangles: z.number(),
  glbMb: z.number(),
  usdzMb: z.number(),
  seconds: z.number().nullable(),
})

/** At most this many of the engine's warnings are kept, each cut to this length: its words go into a row. */
const MAX_WARNINGS = 20
const MAX_WARNING_CHARS = 300

/** The part of the engine's report Foodify keeps; anything else it says is ignored. */
export const engineReport = z.looseObject({
  status: z.string(),
  error: z.string().nullish().transform((e) => e?.slice(-2000)),
  warnings: z.array(z.string()).default([]).transform((ws) => ws.slice(0, MAX_WARNINGS).map((w) => w.slice(0, MAX_WARNING_CHARS))),
  asset: z.looseObject({ size_cm: sizeCm, triangles: z.number(), glb_mb: z.number(), usdz_mb: z.number() }).nullish(),
  seconds: z.record(z.string(), z.number()).nullish(),
})
/** The engine's report, as far as Foodify reads it. */
export type EngineReport = z.infer<typeof engineReport>

/** GET /jobs/{id} on the engine. */
export const engineStatus = z.object({
  state: z.enum(['waiting', 'uploaded', 'queued', 'running', 'done', 'failed']),
  stage: z.string().max(40).nullable(),
  report: engineReport.nullable(),
})
/** The engine's answer about a job. */
export type EngineStatus = z.infer<typeof engineStatus>
