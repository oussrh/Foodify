import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Handle the admin subdomain
  if (host.startsWith('admin.')) {
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // Extract subdomain for restaurant sites (e.g., myrestaurant.foodify.com)
  // Skip if running on localhost, IP address, or Vercel domains
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(host)
  const isLocal = host.startsWith('localhost')
  const isVercel = host.includes('.vercel.app') || host.includes('.netlify.app') || host.includes('.herokuapp.com')
  
  if (!isIp && !isLocal && !isVercel) {
    const parts = host.split('.')
    if (parts.length >= 3) {
      const subdomain = parts[0]
      if (subdomain && subdomain !== 'www') {
        url.pathname = `/restaurant/${subdomain}${url.pathname}`
        return NextResponse.rewrite(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
