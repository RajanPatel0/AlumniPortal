import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  experimental: {
    serverActions: {
      allowedOrigins: ["test.ptu.ac.in"],
    },
  },
};

export default nextConfig;
