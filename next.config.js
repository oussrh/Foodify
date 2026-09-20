// next.config.js

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features introduced in Next.js 15
  experimental: {
    serverActions: {},
    typedRoutes: true,
  },
  // Produce a standalone build for easier deployment
  output: "standalone",
  images: {
    domains: ['res.cloudinary.com', 'api.qrserver.com'],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // The dashboards are never embedded; the public menu is left embeddable.
      { source: '/admin/:path*', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] },
      { source: '/manager/:path*', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] },
    ]
  },
};

export default nextConfig;
