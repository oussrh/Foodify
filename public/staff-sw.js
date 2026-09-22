/* Foodify staff service worker (v2).
   One file, three scopes: a portal's /orders board, the kitchen tablet, and the waiter's phone.
   The cache is named after the registration scope, so two staff apps on one device never share
   or evict each other's shell, and the public menu's worker never meets any of them. It exists
   so a staff app opens when the wifi is down, and for nothing else:
   - Pages in scope: network-first, the cached shell as a fallback.
   - Next static assets: cache-first (they are content-hashed).
   - The API is NEVER cached. A cached order list would show a kitchen work it has already done,
     which is worse than showing nothing; the board says it is offline instead. */
// The scope decides the cache: `/waiter/` and `/manager/orders/` are different apps on the same
// origin, and a shared cache would let one serve the other's shell.
const SCOPE_KEY = new URL(self.registration.scope).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'
const PREFIX = 'foodify-staff-' + SCOPE_KEY + '-'
const VERSION = PREFIX + (new URL(self.location.href).searchParams.get('v') || 'dev')

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
      await Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== VERSION).map((key) => caches.delete(key)))
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
