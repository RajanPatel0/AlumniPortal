import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Check authorization header to verify this request is from our Sentry monitor
  const expectedToken = process.env.SENTRY_MONITOR_TOKEN;
  if (expectedToken) {
    const token = request.headers.get("x-sentry-token") || 
                  request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
                  
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const testSentry = searchParams.get("sentryTest") === "true";

  try {
    // 1. Trigger Sentry exception test if explicitly requested via ?sentryTest=true
    if (testSentry) {
      const testError = new Error("Sentry Health Check Test Exception");
      Sentry.captureException(testError);
      throw testError;
    }

    // 2. Check Database connectivity
    // Executes a simple and fast raw query to verify the database is active and reachable
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Capture database errors or unhandled system failures in Sentry (ignoring our deliberate test error)
    if (!testSentry) {
      Sentry.captureException(error);
    }

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error.message || String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
