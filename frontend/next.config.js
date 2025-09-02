/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Disable static optimization for all pages to avoid SSR router issues
  distDir: '.next',
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://gobudget.duckdns.org/api',
  }
}

module.exports = nextConfig