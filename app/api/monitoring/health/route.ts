import { NextResponse } from "next/server";
import { checkHealth, recordError, getRuntimeStatus, buildHealthResponse } from "@/lib/monitoring";

// ---------------------------------------------------------------------------
// Health check endpoint
// ---------------------------------------------------------------------------

export async function GET() {
  "server-only";

  // Perform health checks on critical systems
  const checks = await Promise.all([
    // Database health check (placeholder - replace with real check)
    checkHealth("database", async () => {
      // TODO: Replace with actual database connectivity check
      // e.g., await prisma.$queryRaw`SELECT 1`
      return true;
    }),

    // Cloudinary health check (placeholder)
    checkHealth("cloudinary", async () => {
      // TODO: Replace with actual Cloudinary config check
      // const configured = isCloudinaryConfigured();
      // return configured;
      return true;
    }),

    // Application runtime status
    checkHealth("runtime", async () => {
      const status = getRuntimeStatus();
      return status.status === "ok";
    }),
  ]);

  // Build the standardized response
  const healthChecks = checks.map((check) => ({
    name: check.name,
    status: check.status,
    latency: check.latency,
    error: check.error,
  }));

  const response = buildHealthResponse(healthChecks);

  const statusCode = response.status === "healthy" ? 200 : 503;
  return NextResponse.json(response, { status: statusCode });
}

// ---------------------------------------------------------------------------
// Stats endpoint (placeholder - expand as needed)
// ---------------------------------------------------------------------------

export async function POST() {
  "server-only";

  try {
    const runtime = getRuntimeStatus();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      runtime,
      message: "Monitoring stats endpoint - expand as needed",
    });
  } catch (error) {
    recordError(error as Error, "monitoring-stats");
    return NextResponse.json(
      { error: "Failed to get monitoring stats" },
      { status: 500 }
    );
  }
}