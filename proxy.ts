import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next 16's middleware (the convention renamed; runs on the Node.js runtime), matched on every path. Rewrites by host
 * alone and never authenticates: an `admin.` host is served under `/admin`, the first label of any other host of three
 * labels or more under `/restaurant/<label>` (`www`, localhost, IPs and hosting domains untouched); the URL is not the route.
 * `/api/*` is one API whatever the host and is never rewritten (the health probe and the dish-view beacon reach it from any host).
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  if (url.pathname.startsWith('/api/')) return NextResponse.next()

  if (host.startsWith('admin.')) {
    if (url.pathname.startsWith('/admin')) return NextResponse.next()
    url.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(url)
  }

  const label = restaurantLabel(host)
  if (!label) return NextResponse.next()
  url.pathname = `/restaurant/${label}${url.pathname}`
  return NextResponse.rewrite(url)
}

// The first label of a restaurant host (myrestaurant.foodify.com), or null for a host that is not
// one: an IP, localhost, a hosting domain, `www`, or fewer than three labels.
function restaurantLabel(host: string): string | null {
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(host)
  const isLocal = host.startsWith('localhost')
  const isHosting = host.includes('.vercel.app') || host.includes('.netlify.app') || host.includes('.herokuapp.com')
  if (isIp || isLocal || isHosting) return null
  const parts = host.split('.')
  const label = parts.length >= 3 ? parts[0] : undefined
  return label && label !== 'www' ? label : null
}

/** Next reads this: the proxy runs on every path (the subdomain rewrite has to see every request) and narrows inside. */
export const config = {
  matcher: ['/:path*'],
}
