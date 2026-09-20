/* Foodify menu service worker (v2).
   Scope: public menu routes, Next static assets, fonts and images. Admin/manager routes are never touched.
   - Pages: network-first, cached fallback, /offline as last resort.
   - Static assets: cache-first. Images/fonts: stale-while-revalidate, any cached size of an image
     serves when offline.
   - The page sends a `precache` message with everything a menu needs so it works offline after one visit.
   - Installed apps refresh the cached menu in the background (periodic sync). */
const VERSION = 'foodify-menu-' + (new URL(self.location.href).searchParams.get('v') || 'dev')
const PRECACHE_INDEX = '/__precache-index'
const OFFLINE_URL = '/offline'
const MAX_IMAGES = 200

const sameOrigin = (url) => url.origin === self.location.origin
const isStatic = (url) => sameOrigin(url) && url.pathname.startsWith('/_next/static/')
const isMenuRoute = (url) => sameOrigin(url) && (url.pathname.startsWith('/restaurant/') || url.pathname === OFFLINE_URL || url.pathname.startsWith('/icons/'))
const isNextImage = (url) => sameOrigin(url) && url.pathname === '/_next/image'
const isImage = (url) => isNextImage(url) || /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(url.pathname) || url.hostname === 'res.cloudinary.com'
const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })).catch(() => undefined)),
    // No skipWaiting here: a new version waits until the guest taps Refresh, so a menu never reloads mid-read.
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable()
        } catch {
          /* unsupported */
        }
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'SKIP_WAITING') self.skipWaiting()
  if (data.type === 'PRECACHE' && Array.isArray(data.urls)) {
    event.waitUntil(precache(data.urls).then(() => reply(event, { type: 'PRECACHED', count: data.urls.length })))
  }
})

function reply(event, message) {
  if (event.source && event.source.postMessage) event.source.postMessage(message)
}

async function precache(urls) {
  const cache = await caches.open(VERSION)
  // Remember what this menu needs so a periodic sync can refresh it later.
  const existing = await readIndex(cache)
  const merged = Array.from(new Set([...existing, ...urls])).slice(-400)
  await cache.put(PRECACHE_INDEX, new Response(JSON.stringify(merged), { headers: { 'Content-Type': 'application/json' } }))
  await Promise.all(
    urls.map(async (u) => {
      try {
        const req = new Request(u, { cache: 'no-cache' })
        const hit = await cache.match(req)
        if (hit) return
        const res = await fetch(req)
        if (res.ok || res.type === 'opaque') await cache.put(req, res)
      } catch {
        /* skip what cannot be fetched */
      }
    }),
  )
  await trimImages(cache)
}

async function readIndex(cache) {
  const res = await cache.match(PRECACHE_INDEX)
  if (!res) return []
  try {
    return await res.json()
  } catch {
    return []
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-menu') event.waitUntil(refreshPrecached())
})

async function refreshPrecached() {
  const cache = await caches.open(VERSION)
  const urls = await readIndex(cache)
  await Promise.all(
    urls
      .filter((u) => !/\/_next\/image|res\.cloudinary\.com/.test(u)) // pages and manifests only; images rarely change
      .map(async (u) => {
        try {
          const res = await fetch(u, { cache: 'no-cache' })
          if (res.ok) await cache.put(u, res)
        } catch {
          /* offline */
        }
      }),
  )
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') {
        cache.put(request, res.clone())
        trimImages(cache)
      }
      return res
    })
    .catch(async () => hit || (await anyImageVariant(cache, request)) || Response.error())
  return hit || refresh
}

/** Offline, a photo cached at any width is better than a broken image. */
async function anyImageVariant(cache, request) {
  const url = new URL(request.url)
  if (!isNextImage(url)) return undefined
  const wanted = url.searchParams.get('url')
  if (!wanted) return undefined
  const keys = await cache.keys()
  for (const k of keys) {
    const ku = new URL(k.url)
    if (isNextImage(ku) && ku.searchParams.get('url') === wanted) return cache.match(k)
  }
  return undefined
}

async function networkFirst(event) {
  const { request } = event
  const cache = await caches.open(VERSION)
  try {
    const preloaded = event.preloadResponse ? await event.preloadResponse : undefined
    const res = preloaded || (await fetch(request))
    if (res && res.ok) cache.put(request, res.clone())
    return res
  } catch {
    // ?lang, ?filter, ?source=pwa and Next's _rsc do not change which menu this is.
    const hit = (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }))
    if (hit) return hit
    if (request.mode === 'navigate') {
      const offline = await cache.match(OFFLINE_URL)
      if (offline) return offline
    }
    return Response.error()
  }
}

async function trimImages(cache) {
  const keys = await cache.keys()
  const images = keys.filter((r) => isImage(new URL(r.url)))
  if (images.length > MAX_IMAGES) await Promise.all(images.slice(0, images.length - MAX_IMAGES).map((r) => cache.delete(r)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (isStatic(url)) return event.respondWith(cacheFirst(request))
  if (isImage(url) || isFont(url)) return event.respondWith(staleWhileRevalidate(request))
  if (isMenuRoute(url) && (request.mode === 'navigate' || request.headers.get('RSC') === '1' || url.pathname.endsWith('/manifest'))) {
    return event.respondWith(networkFirst(event))
  }
})
