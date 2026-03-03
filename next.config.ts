import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic app - no static export
  // Server Actions, DB, AI calls all work
  
  images: {
    unoptimized: false  // Use Next.js image optimization
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;