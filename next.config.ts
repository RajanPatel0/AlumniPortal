import { withSentryConfig } from "@sentry/nextjs";
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ikgptu-at",

  project: "alumni-portal",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  }
});
