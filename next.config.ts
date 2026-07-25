import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Copy PMTiles to public directory for self-hosting (to support byte-range requests locally/production)
try {
  const sourcePath = path.resolve(
    process.cwd(),
    "node_modules/.pnpm/@india-boundary-corrector+data@0.2.2/node_modules/@india-boundary-corrector/data/india_boundary_corrections.pmtiles"
  );
  const destPath = path.resolve(process.cwd(), "public/india_boundary_corrections.pmtiles");

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log("[NextConfig] Successfully copied PMTiles file to public/");
  } else {
    const altSourcePath = path.resolve(
      process.cwd(),
      "node_modules/@india-boundary-corrector/data/india_boundary_corrections.pmtiles"
    );
    if (fs.existsSync(altSourcePath)) {
      fs.copyFileSync(altSourcePath, destPath);
      console.log("[NextConfig] Successfully copied PMTiles file from alt path to public/");
    } else {
      console.warn("[NextConfig] PMTiles source file not found at:", sourcePath);
    }
  }
} catch (err) {
  console.error("[NextConfig] Failed to copy PMTiles file:", err);
}

const nextConfig: NextConfig = {
  /* config options here */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      allowedOrigins: ["test.ptu.ac.in"],
    },
  },
};

export default nextConfig;
