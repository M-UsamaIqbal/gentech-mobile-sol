/**
 * Monitoring utilities for the GenTech Marketplace.
 * Provides health checks, error tracking, and status reporting.
 *
 * Features:
 * - Health check utilities for services
 * - Structured error tracking
 * - Runtime status endpoint
 *
 * All functions are safe to call even when dependencies are unavailable,
 * gracefully falling back to no-op behavior.
 */

// ---------------------------------------------------------------------------
// Health check utilities
// ---------------------------------------------------------------------------

/** Result of a health check */
export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  latency?: number;
  error?: string;
  checkedAt: string;
}

/** Check a service and return its health status */
export async function checkHealth(
  name: string,
  fn: () => Promise<boolean>
): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const healthy = await fn();
    const latency = Date.now() - start;

    return {
      name,
      status: healthy ? "healthy" : "unhealthy",
      latency,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: "unhealthy",
      latency: Date.now() - start,
      error: (error as Error).message,
      checkedAt: new Date().toISOString(),
    };
  }
}

/** Record an error for tracking and observability */
export function recordError(
  error: Error,
  context:
    | "webhook"
    | "api"
    | "worker"
    | "cron"
    | "other"
    | "monitoring-stats" = "other",
  metadata?: Record<string, unknown>
) {
  const errorRecord = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    metadata,
  };

  // Console logging (always works)
  console.error(`[Monitoring] [${context}]`, error);

  // In production, could integrate with:
  // - Sentry/Datadog for error tracking
  // - CloudWatch/Prometheus for metrics
  // - Custom logging service
  // - Database error table

  // Always console.error for visibility
  console.error("[Monitoring]", errorRecord);
}

// ---------------------------------------------------------------------------
// Runtime status endpoint
// ---------------------------------------------------------------------------

/** Simple runtime status check */
export function getRuntimeStatus(): {
  status: "ok" | "error";
  timestamp: string;
  uptime?: number;
} {
  try {
    const uptime = typeof process !== "undefined" ? process.uptime() : undefined;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime,
    };
  } catch {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Monitoring endpoint helpers
// ---------------------------------------------------------------------------

/** Build a standard health check response */
export function buildHealthResponse(
  checks: Array<{
    name: string;
    status: HealthStatus;
    latency?: number;
    error?: string;
  }>
) {
  const allHealthy = checks.every((c) => c.status === "healthy");
  const overallStatus = allHealthy ? "healthy" : "degraded";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };
}

// ---------------------------------------------------------------------------
// Exported for use in API routes
// -------------------------------------------------------------------------*/

