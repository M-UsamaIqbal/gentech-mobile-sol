export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  timestamp: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface CreateAuditLogInput {
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
}
