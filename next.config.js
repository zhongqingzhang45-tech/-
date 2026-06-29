/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ai.lifesys.top" },
    ],
  },
};

module.exports = nextConfig;
