import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { restaurantWhere } from '@/lib/restaurant-code'
import { kitchenBoardPath } from '@/lib/restaurant-paths'
import type { StaffApp } from '@/lib/order-board-page'
import { staffManifestQuery } from '@/lib/schemas/staff-app'

const BOARD = { name: 'Orders', of: (n: string) => `The kitchen board for ${n}: new orders as they arrive.` }

/**
 * What each staff app is called on a home screen, and where tapping its icon lands: `path` is the
 * app's address for the restaurant as the page named it (a code or a uuid), and `id`, when the app
 * has moved, is the address it was installed under.
 */
const APPS: Record<StaffApp, { path: (ref: string) => string; id?: (ref: string) => string; name: string; of: (n: string) => string }> = {
  admin: { path: (ref) => `/admin/orders/${ref}`, ...BOARD },
  manager: { path: (ref) => `/manager/orders/${ref}`, ...BOARD },
  // The tablet's board moved from /kitchen/orders/<ref> to /kitchen/<ref>. A manifest's `id` is
  // the app's identity: a changed one is a different app, which an installed tablet would never
  // update to. So the id stays the address tablets installed under, and only start_url and scope
  // move. The old address still serves the board (a rewrite in next.config.js, not a redirect), so
  // an installed tablet opens inside the scope it was installed with, finds this same manifest URL
  // and id with a new start and scope, and updates in place. The new scope, /kitchen/<ref>, also
  // covers the sold-out screen beside the board (/kitchen/<ref>/menu), which the old one left out.
  kitchen: { path: kitchenBoardPath, id: (ref) => `/kitchen/orders/${ref}`, ...BOARD },
  waiter: { path: (ref) => `/waiter/${ref}`, name: 'Service', of: (n) => `Taking orders at the table in ${n}, and what is ready to carry out.` },
}

/**
 * GET, public: the web app manifest that makes one restaurant's staff app installable: the
 * kitchen board on a tablet, or the waiter's app on a phone. Query `id` (the restaurant, by its
 * code or its uuid, as the page's own link named it) and `portal`; a pair of the wrong shape is
 * 400. It carries the restaurant's name and the app's URL and nothing else: a manifest is fetched
 * without the session cookie, so it must hold nothing a signed-out reader may not see, and the app
 * behind it is guarded. A well-shaped reference that matches no restaurant gets the same answer
 * with no name in it, so the status never tells a stranger which codes are real. An hour's cache.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = staffManifestQuery.safeParse({ id: params.get('id') ?? undefined, portal: params.get('portal') ?? undefined })
  if (!parsed.success) return new NextResponse('Bad request', { status: 400 })

  const restaurant = await prisma.restaurant.findUnique({ where: restaurantWhere(parsed.data.id), select: { name: true } })
  const app = APPS[parsed.data.portal]
  const board = app.path(parsed.data.id)
  const manifest = {
    id: app.id ? app.id(parsed.data.id) : board,
    name: restaurant ? `${app.name} · ${restaurant.name}` : app.name,
    short_name: app.name,
    description: restaurant ? app.of(restaurant.name) : 'A Foodify staff app.',
    start_url: board,
    scope: board,
    // Immersive where the platform allows it: an installed staff app on Android opens with no status
    // bar and no navigation buttons (a swipe from the edge shows them for a moment). On a waiter's
    // phone the buttons sat as a white strip under the app's own tabs and were pressed by mistake.
    // `display` is the fallback for a browser that reads no override; iOS reads neither and keeps
    // its own status bar (lib/order-board-page.ts).
    display: 'standalone',
    display_override: ['fullscreen', 'standalone', 'minimal-ui'],
    // A kitchen tablet stands in a landscape dock as often as it is held, and a waiter's phone
    // is whichever way up they grabbed it; neither is forced.
    orientation: 'any',
    categories: ['business', 'food'],
    background_color: '#FAFAF8',
    theme_color: '#1F6B49',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Tapping the icon focuses the app that is already open rather than opening a second one.
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
    prefer_related_applications: false,
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
