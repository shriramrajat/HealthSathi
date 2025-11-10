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
}

export default withNextIntl(nextConfig);