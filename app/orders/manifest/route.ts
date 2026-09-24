import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { restaurantWhere } from '@/lib/restaurant-code'
import { staffManifestQuery } from '@/lib/schemas/staff-app'

/** What each staff app is called on a home screen, and where tapping its icon lands. */
const APPS = {
  admin: { path: (id: string) => `/admin/orders/${id}`, name: 'Orders', of: (n: string) => `The kitchen board for ${n}: new orders as they arrive.` },
  manager: { path: (id: string) => `/manager/orders/${id}`, name: 'Orders', of: (n: string) => `The kitchen board for ${n}: new orders as they arrive.` },
  kitchen: { path: (id: string) => `/kitchen/orders/${id}`, name: 'Orders', of: (n: string) => `The kitchen board for ${n}: new orders as they arrive.` },
  waiter: { path: (id: string) => `/waiter/${id}`, name: 'Service', of: (n: string) => `Taking orders at the table in ${n}, and what is ready to carry out.` },
} as const

/**
 * GET, public: the web app manifest that makes one restaurant's staff app installable — the
 * kitchen board on a tablet, or the waiter's app on a phone. Query `id` (the restaurant, by its
 * code or its uuid, as the page's own link named it) and `portal`; a bad pair is 400. It carries the restaurant's name and the app's URL and nothing
 * else — a manifest is fetched without the session cookie, so it must hold nothing a signed-out
 * reader may not see; the app behind it is guarded. Answers with an hour's cache, or 404 for an
 * unknown restaurant.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = staffManifestQuery.safeParse({ id: params.get('id') ?? undefined, portal: params.get('portal') ?? undefined })
  if (!parsed.success) return new NextResponse('Bad request', { status: 400 })

  const restaurant = await prisma.restaurant.findUnique({ where: restaurantWhere(parsed.data.id), select: { name: true } })
  if (!restaurant) return new NextResponse('Not found', { status: 404 })

  const app = APPS[parsed.data.portal]
  const board = app.path(parsed.data.id)
  const manifest = {
    id: board,
    name: `${app.name} · ${restaurant.name}`,
    short_name: app.name,
    description: app.of(restaurant.name),
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
