export interface PhoneHistoryEvent {
  id: string;
  listingId: string | null;
  eventType: PhoneHistoryEventType;
  title: string;
  description: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  source: string | null;
  sourceId: string | null;
  occurredAt: string;
  createdAt: string;
}

export type PhoneHistoryEventType =
  | "INSPECTION"
  | "VERIFICATION"
  | "WARRANTY_CLAIM"
  | "REPAIR"
  | "BATTERY_REPLACEMENT"
  | "SCREEN_REPLACEMENT"
  | "OTHER_REPAIR"
  | "STATUS_CHANGE";

export interface CreateHistoryEventInput {
  listingId?: string;
  eventType: PhoneHistoryEventType;
  title: string;
  description?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  source?: string;
  sourceId?: string;
  occurredAt?: Date;
}
