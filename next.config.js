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
