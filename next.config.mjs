/** @type {import('next').NextConfig} */
const nextConfig = {
output: 'standalone',  // REQUIRED for Docker/ECS

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable experimental features to use stable webpack
  experimental: {},
  webpack: (config, { isServer }) => {
    // Fix for mongodb module resolution on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        mongodb: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
}

export default nextConfig
