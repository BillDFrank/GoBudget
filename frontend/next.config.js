/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Fix ESM compatibility issues
  experimental: {
    esmExternals: false,
  },
  transpilePackages: ['@tanstack/react-query'],
  // Disable static optimization for all pages to avoid SSR router issues
  distDir: '.next',
  poweredByHeader: false,
}

module.exports = nextConfig