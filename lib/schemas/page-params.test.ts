import { describe, expect, it } from 'vitest'
import { dishSegments, grainParam, idSegment, listSearch, menuDishSegments, menuQuery, menuSegment, routeParams } from './page-params'

const id = '54d3dcf7-5297-4b2e-99ac-ae4197735f29'

describe('routeParams', () => {
  it('hands back the parsed segments', () => {
    expect(routeParams(idSegment, { id })).toEqual({ id })
    expect(routeParams(dishSegments, { id, dishId: id })).toEqual({ id, dishId: id })
    expect(routeParams(menuSegment, { slug: 'chez-test' })).toEqual({ slug: 'chez-test' })
  })

  it("is the route's 404 for a segment that does not parse, before anything reads it", () => {
    const notFound = expect.objectContaining({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
    expect(() => routeParams(idSegment, { id: 'not-an-id' })).toThrow(notFound)
    expect(() => routeParams(menuSegment, { slug: 'Chez Test' })).toThrow(notFound)
    expect(() => routeParams(menuDishSegments, { slug: 'chez-test', dishId: '1' })).toThrow(notFound)
  })
})

describe('listSearch', () => {
  it('trims the first value of the key', () => {
    expect(listSearch.parse('  chez  ')).toBe('chez')
    expect(listSearch.parse(['bistro', 'cafe'])).toBe('bistro')
  })

  it('reads an absent or an overlong search as no search', () => {
    expect(listSearch.parse(undefined)).toBe('')
    expect(listSearch.parse([])).toBe('')
    expect(listSearch.parse('x'.repeat(101))).toBe('')
    expect(listSearch.parse('x'.repeat(100))).toBe('x'.repeat(100))
  })
})

describe('grainParam', () => {
  it('takes the four grains', () => {
    expect(['day', 'week', 'month', 'year'].map((g) => grainParam.parse(g))).toEqual(['day', 'week', 'month', 'year'])
    expect(grainParam.parse(['month', 'year'])).toBe('month')
  })

  it('reads anything else as daily rather than failing the page', () => {
    expect(grainParam.parse('hour')).toBe('day')
    expect(grainParam.parse(undefined)).toBe('day')
    expect(grainParam.parse(7)).toBe('day')
  })
})

describe('menuQuery', () => {
  it('reads the language, the AR filter and the table the QR code carries', () => {
    expect(menuQuery.parse({ lang: 'fr', filter: 'ar', table: ' 12 ', source: 'pwa' })).toEqual({ lang: 'fr', filter: 'ar', table: '12' })
    expect(menuQuery.parse({ lang: ['en', 'fr'], filter: ['ar'] })).toEqual({ lang: 'en', filter: 'ar' })
  })

  it('drops what it does not know rather than failing the menu', () => {
    expect(menuQuery.parse({})).toEqual({})
    expect(menuQuery.parse({ lang: 'de', filter: 'vegan' })).toEqual({ lang: undefined, filter: undefined })
  })

  it('locks no table from a repeated, empty or overlong table', () => {
    expect(menuQuery.parse({ table: ['1', '2'] }).table).toBeUndefined()
    expect(menuQuery.parse({ table: '  ' }).table).toBeUndefined()
    expect(menuQuery.parse({ table: 'x'.repeat(21) }).table).toBeUndefined()
  })
})
