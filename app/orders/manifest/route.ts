import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { uuid } from '@/lib/schemas/common'
import { z } from 'zod'

const query = z.object({ id: uuid, portal: z.enum(['admin', 'manager', 'kitchen']) })

/**
 * GET, public: the web app manifest that makes one restaurant's kitchen board installable on a
 * tablet. Query `id` (the restaurant) and `portal`; a bad pair is 400. It carries the
 * restaurant's name and the board's URL and nothing else — a manifest is fetched without the
 * session cookie, so it must hold nothing a signed-out reader may not see; the board behind it
 * is guarded. Answers the manifest with an hour's cache, or 404 for an unknown restaurant.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = query.safeParse({ id: params.get('id') ?? undefined, portal: params.get('portal') ?? undefined })
  if (!parsed.success) return new NextResponse('Bad request', { status: 400 })

  const restaurant = await prisma.restaurant.findUnique({ where: { id: parsed.data.id }, select: { name: true } })
  if (!restaurant) return new NextResponse('Not found', { status: 404 })

  const board = `/${parsed.data.portal}/orders/${parsed.data.id}`
  const manifest = {
    id: board,
    name: `Orders · ${restaurant.name}`,
    short_name: 'Orders',
    description: `The kitchen board for ${restaurant.name}: new orders as they arrive.`,
    start_url: board,
    scope: board,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    // A kitchen tablet stands in a landscape dock as often as it is held; neither is forced.
    orientation: 'any',
    categories: ['business', 'food'],
    background_color: '#FAFAF8',
    theme_color: '#1F6B49',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Tapping the icon focuses the board that is already open rather than opening a second one.
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
    prefer_related_applications: false,
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
