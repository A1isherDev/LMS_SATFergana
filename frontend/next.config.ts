import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', // Enable standalone output for Docker
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
};

export default nextConfig;
