// next.config.js
import { fileURLToPath } from 'node:url'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // This directory is the workspace: without it Next walks up to a stray lockfile in the home
  // directory on the development machine and traces files from there.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // Produce a standalone build for easier deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  // The kitchen tablet's screens put the restaurant first, as the waiter's do: the board at
  // /kitchen/<code>, its sold-out screen at /kitchen/<code>/menu. The addresses they replaced are
  // saved on tablets' home screens and are the start_url and scope of every board installed before
  // the move, so they keep serving the same pages, rewritten rather than redirected: a redirect
  // would take an installed app outside the scope it was installed with, where the browser shows
  // its toolbar on every launch, never re-reads the manifest (so the app could never update to the
  // new start_url and scope), and has no cached page to open offline. Served in place, the old
  // address links the same manifest (same `id`, new start_url and scope, app/orders/manifest) and
  // the install updates itself.
  async rewrites() {
    return [
      { source: '/kitchen/orders/:ref', destination: '/kitchen/:ref' },
      { source: '/kitchen/menu/:ref', destination: '/kitchen/:ref/menu' },
    ]
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // The dashboards are never embedded; the public menu is left embeddable.
      { source: '/admin/:path*', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] },
      { source: '/manager/:path*', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] },
    ]
  },
}

export default nextConfig
