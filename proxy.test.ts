import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy'

// The rewrite is read back from the response header Next sets on a rewrite; a pass-through has none.
const rewriteOf = (url: string, host: string) => proxy(new NextRequest(url, { headers: { host } })).headers.get('x-middleware-rewrite')

describe('proxy', () => {
  it('serves an admin host under /admin', () => {
    expect(rewriteOf('https://admin.foodify.app/restaurants', 'admin.foodify.app')).toBe('https://admin.foodify.app/admin/restaurants')
  })

  it('serves a restaurant host under /restaurant/<label>', () => {
    expect(rewriteOf('https://tajine.foodify.app/menu', 'tajine.foodify.app')).toBe('https://tajine.foodify.app/restaurant/tajine/menu')
  })

  it('leaves www, localhost, an IP and a hosting domain alone', () => {
    expect(rewriteOf('https://www.foodify.app/', 'www.foodify.app')).toBeNull()
    expect(rewriteOf('http://localhost:3000/', 'localhost:3000')).toBeNull()
    expect(rewriteOf('http://10.0.0.2:3000/', '10.0.0.2:3000')).toBeNull()
    expect(rewriteOf('https://foodify-abc.vercel.app/', 'foodify-abc.vercel.app')).toBeNull()
  })

  it('never rewrites the API, whatever the host', () => {
    expect(rewriteOf('https://admin.foodify.app/api/health', 'admin.foodify.app')).toBeNull()
    expect(rewriteOf('https://tajine.foodify.app/api/dish-views', 'tajine.foodify.app')).toBeNull()
  })
})
