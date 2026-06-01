/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["avatars.steamstatic.com"],
  },
}

module.exports = nextConfig
