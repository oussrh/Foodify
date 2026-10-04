import { describe, expect, it } from 'vitest'
import { firstIssue } from './common'
import { captureRequest, engineStatus, MAX_VIDEO_BYTES } from './capture'

const dishId = '0b3c6f1e-6a7d-4d2f-9a51-2f8e1c4b7a90'
const ok = { dishId, plateCm: 27, base: 'LOGO', video: { name: 'IMG_0042.MOV', size: 480_000_000 }, photos: [{ name: 'IMG_0043.JPG', size: 3_000_000 }] }

/** The message the form would show for `value`, or null when it is accepted. */
function issue(value: unknown) {
  const result = captureRequest.safeParse(value)
  return result.success ? null : firstIssue(result.error)
}

describe('captureRequest', () => {
  it('takes a dish, a plate diameter, what goes underneath and a video', () => {
    expect(captureRequest.parse(ok)).toEqual(ok)
    expect(captureRequest.parse({ ...ok, base: 'PLAIN', video: { name: 'dish.mp4', size: 1 } }).base).toBe('PLAIN')
  })

  it('takes up to eight JPEG or PNG photos beside the video, or none', () => {
    const photo = (name: string) => ({ name, size: 1000 })
    expect(issue({ ...ok, photos: [] })).toBeNull()
    expect(issue({ ...ok, photos: ['a.jpg', 'b.jpeg', 'c.PNG'].map(photo) })).toBeNull()
    expect(issue({ ...ok, photos: Array.from({ length: 9 }, (_, i) => photo(`p${i}.jpg`)) })).toBe('At most 8 photos')
  })

  it("refuses an iPhone's HEIC photo with the setting that fixes it, and any other kind of file", () => {
    expect(issue({ ...ok, photos: [{ name: 'IMG_1.HEIC', size: 10 }] })).toBe('HEIC photos cannot be read: on iPhone, Settings → Camera → Formats → Most Compatible')
    expect(issue({ ...ok, photos: [{ name: 'menu.pdf', size: 10 }] })).toBe('Photos must be JPEG or PNG')
    expect(issue({ ...ok, photos: [{ name: 'a.jpg', size: 0 }] })).toBe('A photo is empty')
    expect(issue({ ...ok, photos: [{ name: 'a.jpg', size: 60 * 1024 ** 2 }] })).toBe('A photo is larger than 50 MB')
  })

  it('refuses a video and photos that together exceed 2 GB', () => {
    expect(issue({ ...ok, video: { name: 'a.mp4', size: MAX_VIDEO_BYTES - 10 }, photos: [{ name: 'a.jpg', size: 20 }] })).toBe('The video and photos come to more than 2 GB')
  })

  it('refuses a plate smaller than a saucer or larger than a platter, with the reason', () => {
    expect(issue({ ...ok, plateCm: 8 })).toBe('A plate is at least 10 cm across')
    expect(issue({ ...ok, plateCm: 75 })).toBe('A plate is at most 60 cm across')
    expect(issue({ ...ok, plateCm: Number.NaN })).toBe('Enter the plate diameter in cm')
  })

  it('refuses a file that is not a video, an empty one, and one over 2 GB', () => {
    expect(issue({ ...ok, video: { name: 'menu.pdf', size: 10 } })).toBe('Choose a video: MP4 or MOV')
    expect(issue({ ...ok, video: { name: 'a.mp4', size: 0 } })).toBe('The video is empty')
    expect(issue({ ...ok, video: { name: 'a.mp4', size: MAX_VIDEO_BYTES + 1 } })).toBe('The video is larger than 2 GB')
  })

  it('refuses a dish id that is not a uuid, and an underside it does not know', () => {
    expect(captureRequest.safeParse({ ...ok, dishId: '42' }).success).toBe(false)
    expect(captureRequest.safeParse({ ...ok, base: 'SKETCH' }).success).toBe(false)
  })
})

describe('engineStatus', () => {
  it("reads the engine's answer, keeping the report's warnings and ignoring what Foodify does not use", () => {
    const status = engineStatus.parse({ state: 'done', stage: null, updated: 1, report: { status: 'ok', warnings: ['short capture'], colmap: { registered: 140 } } })
    expect(status.report?.warnings).toEqual(['short capture'])
  })

  it("bounds what the engine's words put into a row: 20 warnings of 300 characters, the error's end, a short stage", () => {
    const status = engineStatus.parse({
      state: 'failed',
      stage: null,
      report: { status: 'failed', error: `${'x'.repeat(5000)}END`, warnings: Array.from({ length: 50 }, () => 'w'.repeat(1000)) },
    })
    expect(status.report?.warnings).toHaveLength(20)
    expect(status.report?.warnings[0]).toHaveLength(300)
    expect(status.report?.error).toHaveLength(2000)
    expect(status.report?.error?.endsWith('END')).toBe(true)
    expect(engineStatus.safeParse({ state: 'running', stage: 's'.repeat(41), report: null }).success).toBe(false)
  })

  it('gives a report without warnings an empty list, and refuses a state it does not know', () => {
    expect(engineStatus.parse({ state: 'running', stage: 'dense', report: { status: 'failed' } }).report?.warnings).toEqual([])
    expect(engineStatus.safeParse({ state: 'exploded', stage: null, report: null }).success).toBe(false)
  })
})
