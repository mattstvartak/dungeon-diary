/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dungeon-diary/ui', '@dungeon-diary/types'],
  images: {
    domains: [],
  },
}

module.exports = nextConfig
