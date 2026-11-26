import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { AuditLogEntry, AuditLogFilters, CreateAuditLogInput } from "../types";

const auditLogSelect = {
  id: true,
  actorId: true,
  action: true,
  resource: true,
  resourceId: true,
  timestamp: true,
  before: true,
  after: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  actor: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

type AuditLogRow = Prisma.AuditLogGetPayload<{ select: typeof auditLogSelect }>;

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorId,
    actorName: row.actor.name,
    action: row.action,
    resource: row.resource,
    resourceId: row.resourceId,
    timestamp: row.timestamp.toISOString(),
    before: row.before,
    after: row.after,
    metadata: row.metadata,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}

/**
 * Creates an audit log entry for sensitive operations.
 * Should be called after successful completion of the audited action.
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      before: input.before as Prisma.InputJsonValue,
      after: input.after as Prisma.InputJsonValue,
      metadata: input.metadata as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

/**
 * Retrieves audit logs with optional filtering.
 * Only accessible to admins (authorization enforced at service/action layer).
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<{
  items: AuditLogEntry[];
  total: number;
}> {
  const where: Prisma.AuditLogWhereInput = {};
  
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.action) where.action = filters.action;
  if (filters.resource) where.resource = filters.resource;
  if (filters.resourceId) where.resourceId = filters.resourceId;

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
      select: auditLogSelect,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map(toAuditLogEntry),
    total,
  };
}

/**
 * Retrieves audit logs for a specific resource.
 */
export async function getAuditLogsForResource(
  resource: string,
  resourceId: string,
  limit = 20,
): Promise<AuditLogEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { resource, resourceId },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: auditLogSelect,
  });
  return rows.map(toAuditLogEntry);
}

/**
 * Retrieves audit logs for a specific actor (user).
 */
export async function getAuditLogsForActor(
  actorId: string,
  limit = 20,
): Promise<AuditLogEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { actorId },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: auditLogSelect,
  });
  return rows.map(toAuditLogEntry);
}

/**
 * Logs a sensitive data access event (e.g., full IMEI access).
 * This should be called whenever sensitive data is accessed by authorized users.
 */
export async function logSensitiveDataAccess(input: {
  actorId: string;
  dataType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "SENSITIVE_DATA_ACCESS",
      resource: input.dataType,
      resourceId: input.resourceId,
      metadata: {
        dataType: input.dataType,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

// Re-export for use in other features
export { logSensitiveDataAccess as logImeiAccess };
