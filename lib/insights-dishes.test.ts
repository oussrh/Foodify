import { describe, expect, it } from 'vitest'
import { orderRate, overlooked, perOpen, topBy, type DishStat } from './insights-dishes'

const dish = (name: string, over: Partial<DishStat> = {}): DishStat => ({
  id: name,
  name,
  views: 0,
  arViews: 0,
  cartAdds: 0,
  ordered: 0,
  revenueMinor: 0,
  ...over,
})

describe('topBy', () => {
  it('ranks most first, stops at the count and leaves out a dish with none', () => {
    const stats = [dish('a', { views: 3 }), dish('b', { views: 9 }), dish('c', { views: 0 }), dish('d', { views: 5 })]
    expect(topBy(stats, (d) => d.views, 2).map((d) => d.name)).toEqual(['b', 'd'])
    expect(topBy(stats, (d) => d.views).map((d) => d.name)).toEqual(['b', 'd', 'a'])
  })

  it('breaks a tie by name, so the list does not reshuffle between loads', () => {
    const stats = [dish('Tagine', { ordered: 4 }), dish('Couscous', { ordered: 4 })]
    expect(topBy(stats, (d) => d.ordered).map((d) => d.name)).toEqual(['Couscous', 'Tagine'])
  })

  it('leaves the list it was given in its order', () => {
    const stats = [dish('a', { views: 1 }), dish('b', { views: 2 })]
    topBy(stats, (d) => d.views)
    expect(stats.map((d) => d.name)).toEqual(['a', 'b'])
  })
})

describe('orderRate', () => {
  it('is portions per hundred opens, and zero for a dish nobody opened', () => {
    expect(orderRate({ views: 50, ordered: 10 })).toBe(20)
    expect(orderRate({ views: 0, ordered: 3 })).toBe(0)
  })
})

describe('overlooked', () => {
  it('finds a well-opened dish ordered at under half the menu rate, lowest first', () => {
    const stats = [
      dish('Seller', { views: 100, ordered: 40 }),
      dish('Browsed', { views: 80, ordered: 2 }),
      dish('Ignored', { views: 60, ordered: 0 }),
      dish('Fine', { views: 50, ordered: 15 }),
    ]
    expect(overlooked(stats).map((d) => d.name)).toEqual(['Ignored', 'Browsed'])
  })

  it('does not judge a dish on a handful of opens', () => {
    const stats = [dish('Seller', { views: 40, ordered: 20 }), dish('Rare', { views: 3, ordered: 0 })]
    expect(overlooked(stats)).toEqual([])
  })

  it('raises the bar with the busiest dish, so a quiet corner of a busy menu is left alone', () => {
    // The busiest has 1,000 opens: a dish needs 100 before its rate says anything.
    const stats = [dish('Headliner', { views: 1000, ordered: 300 }), dish('Corner', { views: 40, ordered: 0 })]
    expect(overlooked(stats)).toEqual([])
  })

  it('says nothing when nothing was ordered or opened: that is the menu, not a dish', () => {
    expect(overlooked([dish('a', { views: 90 }), dish('b', { views: 40 })])).toEqual([])
    expect(overlooked([])).toEqual([])
  })
})

describe('perOpen', () => {
  it('is a ratio to one decimal, not a share, since it can pass one', () => {
    expect(perOpen(33, 19)).toBe('1.7 per dish opened')
    expect(perOpen(4, 8)).toBe('0.5 per dish opened')
  })

  it('is null when nothing was opened', () => {
    expect(perOpen(3, 0)).toBeNull()
  })
})
