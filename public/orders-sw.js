/* Foodify kitchen board service worker (v1).
   Scope: one portal's /orders routes only — the public menu has its own worker and the two never
   meet. It exists so the board opens when the tablet's wifi is down, and for nothing else:
   - Pages in scope: network-first, the cached shell as a fallback.
   - Next static assets: cache-first (they are content-hashed).
   - The API is NEVER cached. A cached order list would show a kitchen work it has already done,
     which is worse than showing nothing; the board says it is offline instead. */
const VERSION = 'foodify-orders-' + (new URL(self.location.href).searchParams.get('v') || 'dev')

const sameOrigin = (url) => url.origin === self.location.origin
const isStatic = (url) => sameOrigin(url) && url.pathname.startsWith('/_next/static/')
const isApi = (url) => sameOrigin(url) && url.pathname.startsWith('/api/')

self.addEventListener('install', () => {
  // No skipWaiting: a new version waits rather than reloading a board mid-service.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key.startsWith('foodify-orders-') && key !== VERSION).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(VERSION)
    await cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(VERSION)
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // The orders themselves always come from the server, or not at all.
  if (isApi(url)) return
  if (isStatic(url)) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (request.mode === 'navigate' && sameOrigin(url)) {
    event.respondWith(networkFirst(request))
  }
})
