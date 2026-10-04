import { describe, expect, it, vi } from 'vitest'

vi.mock('./engine', () => ({ signedEngineUrl: (method: string, path: string, ttl: number) => `signed:${method}:${path}:${ttl}` }))

import { Prisma } from '@/generated/prisma/client'
import { captureView, type CaptureRow } from './view'

const row = (over: Partial<CaptureRow> = {}): CaptureRow => ({
  id: 'job-1',
  status: 'PROCESSING',
  stage: 'dense',
  warnings: [],
  error: null,
  plateCm: new Prisma.Decimal('27'),
  base: 'LOGO',
  summary: null,
  createdAt: new Date('2026-10-03T20:00:00Z'),
  ...over,
})

describe('captureView', () => {
  it('shows a processing job with its progress in words, and no preview yet', () => {
    expect(captureView(row())).toEqual({
      id: 'job-1',
      status: 'PROCESSING',
      progress: { step: 4, of: 6, label: 'Measuring the dish in depth' },
      warnings: [],
      error: null,
      plateCm: '27.0',
      base: 'LOGO',
      summary: null,
      previewUrl: null,
      createdAt: '2026-10-03T20:00:00.000Z',
    })
  })

  it('gives a ready job an hour-long signed address of its model, for the preview, and its summary', () => {
    const summary = { sizeCm: { width: 27, height: 6, depth: 27 }, triangles: 50_000, glbMb: 3, usdzMb: 2.8, seconds: 640 }
    const view = captureView(row({ status: 'READY', stage: null, summary }))
    expect(view.previewUrl).toBe('signed:GET:/jobs/job-1/files/dish.glb:3600')
    expect(view.progress).toBeNull()
    expect(view.summary).toEqual(summary)
  })

  it('shows a summary the column cannot be read as none, rather than failing the page', () => {
    expect(captureView(row({ status: 'READY', summary: { triangles: 'many' } })).summary).toBeNull()
  })
})
