import "server-only";

import {
  createAuditLog as createAuditLogRecord,
  getAuditLogs,
  getAuditLogsForActor,
  getAuditLogsForResource,
} from "../repositories/audit.repository";
import type { AuditLogEntry, AuditLogFilters, CreateAuditLogInput } from "../types";

function warn(scope: string, error: unknown): void {
  console.warn(`[audit] ${scope}:`, error instanceof Error ? error.message : error);
}

/**
 * Logs an audit entry for sensitive operations.
 * This should be called after successful completion of audited actions.
 * The IP address and user agent should be extracted from the request context.
 */
export async function logAudit(input: CreateAuditLogInput): Promise<void> {
  try {
    await createAuditLogRecord(input);
  } catch (error) {
    warn("failed to create audit log", error);
    // Audit log failures should not block the main operation
    // but should be logged for monitoring
  }
}

/**
 * Retrieves audit logs. Only accessible to admins.
 * Authorization must be enforced by the caller (action/controller).
 */
export async function getAuditLogList(
  filters: AuditLogFilters = {},
): Promise<{ items: AuditLogEntry[]; total: number }> {
  try {
    return await getAuditLogs(filters);
  } catch (error) {
    warn("failed to retrieve audit logs", error);
    return { items: [], total: 0 };
  }
}

/**
 * Retrieves audit history for a specific resource.
 * Useful for showing modification history in admin panels.
 */
export async function getResourceAuditHistory(
  resource: string,
  resourceId: string,
  limit = 20,
): Promise<AuditLogEntry[]> {
  try {
    return await getAuditLogsForResource(resource, resourceId, limit);
  } catch (error) {
    warn("failed to retrieve resource audit history", error);
    return [];
  }
}

/**
 * Retrieves audit history for a specific user.
 * Useful for user activity tracking and security investigations.
 */
export async function getUserAuditHistory(
  actorId: string,
  limit = 20,
): Promise<AuditLogEntry[]> {
  try {
    return await getAuditLogsForActor(actorId, limit);
  } catch (error) {
    warn("failed to retrieve user audit history", error);
    return [];
  }
}

/**
 * Helper to extract IP address and user agent from a Next.js request.
 * This should be called in server actions or API routes to populate audit metadata.
 */
export function getRequestMetadata(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor 
    ? forwardedFor.split(",")[0]?.trim() ?? null
    : (realIp?.trim() ?? null);
  
  const userAgent = request.headers.get("user-agent") ?? null;
  
  return { ipAddress, userAgent };
}
