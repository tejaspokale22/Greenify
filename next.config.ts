import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enables static export (required for Netlify if no SSR)
  images: {
    unoptimized: true, // Disables Next.js image optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
