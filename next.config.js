// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features introduced in Next.js 15
  experimental: {
    serverActions: {},
    typedRoutes: true,
  },
  // Internationalization for English and French content
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
  },
  // Produce a standalone build for easier deployment
  output: "standalone",
};

export default nextConfig;
