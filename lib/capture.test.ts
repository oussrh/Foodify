import { describe, expect, it } from 'vitest'
import { CAPTURE_STAGES, captureError, captureProgress, captureSummary, captureUpdate, engineLogoUrl } from './capture'
import { engineReport, engineStatus } from './schemas/capture'

describe('captureUpdate', () => {
  const now = new Date('2026-10-03T21:00:00Z')
  const asset = { size_cm: { width: 27, height: 6, depth: 27 }, triangles: 50_000, glb_mb: 3, usdz_mb: 2.8 }
  const engine = (value: object) => engineStatus.parse({ stage: null, report: null, ...value })

  it('keeps a job processing while the engine queues or works on it, following its stage', () => {
    expect(captureUpdate(engine({ state: 'queued' }), now)).toEqual({ status: 'PROCESSING', stage: null })
    expect(captureUpdate(engine({ state: 'running', stage: 'dense' }), now)).toEqual({ status: 'PROCESSING', stage: 'dense' })
  })

  it("makes a finished job ready for review, with the engine's warnings, its summary and when it finished", () => {
    const report = { status: 'ok', warnings: ['only 70% of the frames were placed'], asset, seconds: { total: 640 } }
    expect(captureUpdate(engine({ state: 'done', report }), now)).toEqual({
      status: 'READY',
      stage: null,
      warnings: ['only 70% of the frames were placed'],
      finishedAt: now,
      summary: { sizeCm: { width: 27, height: 6, depth: 27 }, triangles: 50_000, glbMb: 3, usdzMb: 2.8, seconds: 640 },
    })
    expect(captureUpdate(engine({ state: 'done', report: { status: 'ok' } }), now)).not.toHaveProperty('summary')
  })

  it('fails a job the engine failed, with its reason and its advice', () => {
    const report = { status: 'failed', error: 'RuntimeError: COLMAP registered no cameras', warnings: ['capture.mp4: HDR video'] }
    expect(captureUpdate(engine({ state: 'failed', report }), now)).toEqual({
      status: 'FAILED',
      stage: null,
      warnings: ['capture.mp4: HDR video'],
      error: 'RuntimeError: COLMAP registered no cameras',
      finishedAt: now,
    })
  })

  it('fails a started job the engine no longer has, and asks for the dish to be filmed again', () => {
    for (const state of ['waiting', 'uploaded']) {
      expect(captureUpdate(engine({ state }), now)).toMatchObject({ status: 'FAILED', error: 'The engine no longer has this video. Film the dish again.' })
    }
    expect(captureUpdate(engine({ state: 'done' }), now)).toMatchObject({ status: 'FAILED' })
  })
})

describe('captureProgress', () => {
  it('numbers each engine stage from 1 and names it in plain words', () => {
    expect(captureProgress('check')).toEqual({ step: 1, of: 6, label: 'Checking the video' })
    expect(captureProgress('frames')).toEqual({ step: 2, of: 6, label: 'Choosing the sharpest frames' })
    expect(captureProgress('mesh_texture_export')).toEqual({ step: 6, of: 6, label: 'Building the model and its colours' })
    expect(CAPTURE_STAGES.map((s) => captureProgress(s.key).step)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('reads no stage, or one it does not know, as waiting for the engine', () => {
    expect(captureProgress(null)).toEqual({ step: 0, of: 6, label: 'Waiting for the engine' })
    expect(captureProgress('something-new')).toEqual({ step: 0, of: 6, label: 'Waiting for the engine' })
  })
})

describe('captureSummary', () => {
  it("keeps the model's size, triangles, file sizes and the total time", () => {
    const report = engineReport.parse({
      status: 'ok',
      asset: { size_cm: { width: 27.2, height: 5.8, depth: 27.1 }, triangles: 49_998, glb_mb: 3.1, usdz_mb: 2.9, base: {} },
      seconds: { frames: 6.3, total: 612.4 },
    })
    expect(captureSummary(report)).toEqual({ sizeCm: { width: 27.2, height: 5.8, depth: 27.1 }, triangles: 49_998, glbMb: 3.1, usdzMb: 2.9, seconds: 612.4 })
  })

  it('has no time when the engine gave none, and nothing at all when it made no model', () => {
    const noTime = engineReport.parse({ status: 'ok', asset: { size_cm: { width: 1, height: 1, depth: 1 }, triangles: 1, glb_mb: 1, usdz_mb: 1 } })
    expect(captureSummary(noTime)?.seconds).toBeNull()
    expect(captureSummary(engineReport.parse({ status: 'failed', asset: null }))).toBeNull()
  })
})

describe('captureError', () => {
  it("is the last line of the engine's error, without the traceback", () => {
    const report = engineReport.parse({ status: 'failed', error: 'Traceback (most recent call last):\n  File "x"\nRuntimeError: COLMAP registered no cameras\n' })
    expect(captureError(report)).toBe('RuntimeError: COLMAP registered no cameras')
  })

  it('says the engine could not make a model when it gave no reason', () => {
    expect(captureError(null)).toBe('The engine could not make a model from this video.')
    expect(captureError(engineReport.parse({ status: 'failed' }))).toBe('The engine could not make a model from this video.')
  })
})

describe('engineLogoUrl', () => {
  it('asks Cloudinary for the logo as a PNG, whatever it was uploaded as', () => {
    expect(engineLogoUrl('https://res.cloudinary.com/demo/image/upload/v17/restaurants/x/branding/logo.svg')).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_png/v17/restaurants/x/branding/logo.svg',
    )
  })

  it('passes a PNG or JPEG elsewhere as it is', () => {
    expect(engineLogoUrl('https://cdn.example.com/logo.png')).toBe('https://cdn.example.com/logo.png')
    expect(engineLogoUrl('https://cdn.example.com/logo.JPG?v=2')).toBe('https://cdn.example.com/logo.JPG?v=2')
  })

  it('gives nothing for no logo, a raw upload, an SVG elsewhere, or a plain http address', () => {
    expect(engineLogoUrl(null)).toBeNull()
    expect(engineLogoUrl('')).toBeNull()
    expect(engineLogoUrl('https://res.cloudinary.com/demo/raw/upload/v1/logo.svg')).toBeNull()
    expect(engineLogoUrl('https://cdn.example.com/logo.svg')).toBeNull()
    expect(engineLogoUrl('http://cdn.example.com/logo.png')).toBeNull()
  })
})
