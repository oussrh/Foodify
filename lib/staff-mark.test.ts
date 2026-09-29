import { describe, expect, it } from 'vitest'
import { STAFF_MARK } from './staff-mark'

// The maskable icon draws the mark at 0.8 about the centre, and a launcher may crop to a circle of
// 40 % of the icon's width: every point of the mark must land inside it.
const SAFE_RADIUS = STAFF_MARK.box * 0.4
const SCALE = 0.8
const centre = STAFF_MARK.box / 2
const fromCentre = (x: number, y: number) => Math.hypot(x - centre, y - centre) * SCALE

describe('the Foodizar mark', () => {
  it("keeps the F's corners inside the maskable icon's safe zone", () => {
    for (const bar of STAFF_MARK.bars) {
      for (const [x, y] of [
        [bar.x, bar.y],
        [bar.x + bar.width, bar.y],
        [bar.x, bar.y + bar.height],
        [bar.x + bar.width, bar.y + bar.height],
      ] as const) {
        expect(fromCentre(x, y)).toBeLessThanOrEqual(SAFE_RADIUS)
      }
    }
  })

  it('keeps the ringed badge inside it too', () => {
    const { cx, cy, r, ring } = STAFF_MARK.badge
    expect(fromCentre(cx, cy) + (r + ring) * SCALE).toBeLessThanOrEqual(SAFE_RADIUS)
  })

  it("draws each app's glyph inside the badge", () => {
    const { cx, cy, r } = STAFF_MARK.badge
    for (const path of Object.values(STAFF_MARK.glyphs)) {
      const numbers = [...path.matchAll(/-?\d+/g)].map(([n]) => Number(n))
      // Every number in these paths is an x or a y near the badge; none may reach its edge.
      for (const n of numbers) expect(Math.min(Math.abs(n - cx), Math.abs(n - cy))).toBeLessThan(r - STAFF_MARK.glyphStroke / 2)
    }
  })
})
