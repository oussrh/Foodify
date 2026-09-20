/* Foodify menu service worker.
   Scope: only public menu routes, Next static assets, fonts and images.
   Pages are network-first (menus change), assets cache-first, images/fonts stale-while-revalidate.
   Admin/manager routes are never touched. */
const VERSION = 'foodify-menu-v1'
const MAX_IMAGES = 120

const isStatic = (url) => url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')
const isMenuRoute = (url) => url.origin === self.location.origin && (url.pathname.startsWith('/restaurant/') || url.pathname.startsWith('/icons/'))
const isImage = (url) =>
  /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(url.pathname) ||
  url.hostname === 'res.cloudinary.com' ||
  (url.origin === self.location.origin && url.pathname.startsWith('/_next/image'))
const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

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
    .catch(() => hit)
  return hit || refresh
}

async function networkFirst(request) {
  const cache = await caches.open(VERSION)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    const hit = await cache.match(request)
    if (hit) return hit
    throw new Error('offline')
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
    return event.respondWith(networkFirst(request))
  }
})
