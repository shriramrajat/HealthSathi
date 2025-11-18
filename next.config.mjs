import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable image optimization for production
  images: {
    unoptimized: false,
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
  // Enable SWC minification for bundle size reduction
  swcMinify: true,
  // Disable static page generation for auth-protected routes
  experimental: {
    missingSuspenseWithCSRBailout: false,
    appDir: true,
    serverActions: true,
  },
  // This tells Next.js to skip prerendering
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
}

export default withNextIntl(nextConfig);
