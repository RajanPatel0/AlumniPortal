"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

export function SentryPageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;

      // Log the page view metric to Sentry, tagging it with the page path
      Sentry.metrics.count("alumni_page_view", 1, {
        attributes: { path: pathname },
      });
    }
  }, [pathname]);

  return null;
}
