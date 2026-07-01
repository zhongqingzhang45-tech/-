/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ai.lifesys.top" },
    ],
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        "**/node_modules",
        "**/.git",
        "**/lib/core/_legacy/**",
        "**/lib/core/digital-life/_experimental/**",
        "**/lib/live2d/**",
        "**/external/**",
      ],
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
