/* Foodify staff service worker (v4).
   One file, three scopes: a portal's /orders board, the kitchen tablet, and the waiter's phone.
   The cache is named after the registration scope, so two staff apps on one device never share
   or evict each other's shell, and the public menu's worker never meets any of them. It exists
   so a staff app opens when the wifi is down, and for nothing else:
   - Pages in scope: network-first, the cached shell as a fallback.
   - Next static assets: cache-first (they are content-hashed).
   - The API is NEVER cached. A cached order list would show a kitchen work it has already done,
     which is worse than showing nothing; the board says it is offline instead.
   - Web Push (server/push.ts): a new order wakes a kitchen board, a ready order a waiter's phone,
     with the app in the background or the screen locked. The payload carries an order number, a
     table and a dish count, never anything about the guest. */
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


// The alert's shape follows the room it lands in: a new order is long and stays on screen until
// someone on the pass deals with it; a ready order is a short double buzz in a waiter's apron.
const VIBRATE = { order: [300, 120, 300, 120, 600], ready: [180, 90, 180, 90, 320] }

/** Whether one of this scope's pages is on screen: it chimes by itself, so the notification stays quiet. */
async function pageIsVisible() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  return windows.some((client) => client.url.startsWith(self.registration.scope) && (client.visibilityState === 'visible' || client.focused))
}

self.addEventListener('push', (event) => {
  let message = null
  try {
    message = event.data ? event.data.json() : null
  } catch {
    message = null
  }
  if (!message || typeof message.title !== 'string') return
  // The pass's alerts (a new order, a request to take something off) insist; the floor's (a
  // plate ready, the kitchen's answer) buzz and go.
  const kind = message.kind === 'ready' || message.kind === 'answer' ? 'ready' : 'order'
  event.waitUntil(
    (async () => {
      // Browsers want a notification for every push, so a visible page still gets one, silently.
      const silent = await pageIsVisible()
      await self.registration.showNotification(message.title, {
        body: typeof message.body === 'string' ? message.body : '',
        tag: typeof message.tag === 'string' ? message.tag : undefined,
        renotify: typeof message.tag === 'string',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: {
          url: typeof message.url === 'string' ? message.url : self.registration.scope,
          restaurantId: typeof message.restaurantId === 'string' ? message.restaurantId : null,
          restaurantCode: typeof message.restaurantCode === 'string' ? message.restaurantCode : null,
        },
        vibrate: VIBRATE[kind],
        requireInteraction: kind === 'order',
        silent,
      })
    })(),
  )
})

// A restaurant's code (six Crockford characters) and a uuid: the only two shapes a board's address
// carries, so nothing else from a payload is ever appended to a scope.
const CODE = /^[0-9A-HJKMNP-TV-Z]{6}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The addresses this scope's board for the payload's restaurant can be open at: by its code, or by
 * the uuid an older install carries; on the tablet also at /kitchen/orders/<ref>, the address it
 * was installed under, which still serves the board (a rewrite in next.config.js).
 */
function ownBoards(data) {
  const refs = [data.restaurantCode, data.restaurantId].filter((ref) => typeof ref === 'string' && (CODE.test(ref) || UUID.test(ref)))
  const paths = refs.flatMap((ref) => (self.registration.scope.endsWith('/kitchen/') ? [ref, 'orders/' + ref] : [ref]))
  return paths.map((path) => new URL(self.registration.scope + path, self.location.origin).href)
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Only a same-origin address is ever opened, whatever the payload said.
  const data = event.notification.data || {}
  const target = new URL(data.url || self.registration.scope, self.location.origin)
  // A portal's board (/manager/orders/<code>, /admin/orders/<code>) is outside the tablet's
  // address the payload names: this worker's own board is built from its scope and the code.
  const boards = ownBoards(data)
  const own = !target.href.startsWith(self.registration.scope) && boards.length > 0 ? new URL(boards[0]) : target
  const url = sameOrigin(own) ? own.href : self.registration.scope
  // The same board by either name: a window already open on it is focused, never moved.
  const same = (href) => href === url || boards.includes(href)
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((client) => client.url.startsWith(self.registration.scope))
      if (!open) return self.clients.openWindow(url)
      const focused = await open.focus()
      const inScope = url.startsWith(self.registration.scope)
      return !inScope || same(focused.url) || !('navigate' in focused) ? focused : focused.navigate(url)
    })(),
  )
})

// A push service can rotate a subscription (pushsubscriptionchange). Re-subscribing here would
// need the VAPID key and a session, and a half-done attempt could leave a stale row pointing at a
// dead endpoint; the page re-subscribes on its next open instead, and the server drops the old
// endpoint the first time the push service answers 404 or 410 for it.
