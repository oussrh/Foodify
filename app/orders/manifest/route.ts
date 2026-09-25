import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { restaurantWhere } from '@/lib/restaurant-code'
import { kitchenBoardPath, kitchenMenuPath, waiterPath } from '@/lib/restaurant-paths'
import type { StaffApp } from '@/lib/order-board-page'
import { STAFF_APP_IDENTITY, STAFF_BRAND, staffAppName, staffBrandApp, staffIconPath, type StaffBrandApp } from '@/lib/staff-apps'
import { staffManifestQuery } from '@/lib/schemas/staff-app'

/**
 * Where tapping each staff app's icon lands: `path` is the app's address for the restaurant as the
 * page named it (a code or a uuid), and `id`, when the app has moved, is the address it was
 * installed under.
 */
const APPS: Record<StaffApp, { path: (ref: string) => string; id?: (ref: string) => string }> = {
  admin: { path: (ref) => `/admin/orders/${ref}` },
  manager: { path: (ref) => `/manager/orders/${ref}` },
  // The tablet's board moved from /kitchen/orders/<ref> to /kitchen/<ref>. A manifest's `id` is
  // the app's identity: a changed one is a different app, which an installed tablet would never
  // update to. So the id stays the address tablets installed under, and only start_url and scope
  // move. The old address still serves the board (a rewrite in next.config.js, not a redirect), so
  // an installed tablet opens inside the scope it was installed with, finds this same manifest URL
  // and id with a new start and scope, and updates in place. The new scope, /kitchen/<ref>, also
  // covers the sold-out screen beside the board (/kitchen/<ref>/menu), which the old one left out.
  kitchen: { path: kitchenBoardPath, id: (ref) => `/kitchen/orders/${ref}` },
  waiter: { path: waiterPath },
}

/** A long press on the installed icon: the screens a device goes to straight from the home screen, all inside its scope. */
function shortcuts(app: StaffApp, ref: string, icon: string) {
  const icons = [{ src: icon, sizes: '192x192', type: 'image/png' }]
  if (app === 'kitchen') return [{ name: 'Sold out', description: 'Mark a dish as run out, or back on.', url: kitchenMenuPath(ref), icons }]
  if (app === 'waiter') {
    return [
      { name: 'Tables', description: 'The room, and what is ready to carry out.', url: waiterPath(ref), icons },
      { name: 'Orders', description: 'Every order on the floor.', url: `${waiterPath(ref)}/orders`, icons },
    ]
  }
  return []
}

/** The app's icons: square for any launcher, and the maskable one whose mark sits in the central 80 %. */
function icons(brand: StaffBrandApp) {
  return [
    { src: staffIconPath(brand, '192'), sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: staffIconPath(brand, '512'), sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: staffIconPath(brand, 'maskable-512'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
}

/**
 * GET, public: the web app manifest that makes one restaurant's staff app installable: Foodizar
 * Kitchen on a tablet, Foodizar Waiter on a phone, Foodizar Orders from a portal's board. Query
 * `id` (the restaurant, by its code or its uuid, as the page's own link named it) and `portal`; a
 * pair of the wrong shape is 400. It carries the restaurant's name and the app's URL and nothing
 * else: a manifest is fetched without the session cookie, so it must hold nothing a signed-out
 * reader may not see, and the app behind it is guarded. A well-shaped reference that matches no
 * restaurant gets the same answer with no name in it, so the status never tells a stranger which
 * codes are real. An hour's cache.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = staffManifestQuery.safeParse({ id: params.get('id') ?? undefined, portal: params.get('portal') ?? undefined })
  if (!parsed.success) return new NextResponse('Bad request', { status: 400 })

  const { id: ref, portal } = parsed.data
  const restaurant = await prisma.restaurant.findUnique({ where: restaurantWhere(ref), select: { name: true } })
  const app = APPS[portal]
  const brand = staffBrandApp(portal)
  const identity = STAFF_APP_IDENTITY[brand]
  const board = app.path(ref)
  const manifest = {
    id: app.id ? app.id(ref) : board,
    name: staffAppName(brand, restaurant?.name ?? null),
    short_name: identity.shortName,
    description: restaurant ? identity.about(restaurant.name) : identity.generic,
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
    // Android draws its splash from these: the Basil ground, the icon and the name. The theme colour
    // is the installed app's title bar and app-switcher card; in a browser tab the page's own
    // viewport colour (lib/staff-viewport.ts) keeps the light bar.
    background_color: STAFF_BRAND.color,
    theme_color: STAFF_BRAND.color,
    icons: icons(brand),
    shortcuts: shortcuts(portal, ref, staffIconPath(brand, '192')),
    // Tapping the icon focuses the app that is already open rather than opening a second one.
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
    prefer_related_applications: false,
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
