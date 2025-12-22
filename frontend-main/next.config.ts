import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict Node.js version checking
  experimental: {
    // @ts-ignore
    allowedNodeVersions: ["18.x", "20.x", "22.x"]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
