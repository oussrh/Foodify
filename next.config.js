/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features that ship with Next.js 15
  experimental: {
    serverActions: true,
    typedRoutes: true,
  },
  // Internationalization for English and French content
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  // Produce a standalone build for easier deployment
  output: 'standalone',
};

export default nextConfig;
