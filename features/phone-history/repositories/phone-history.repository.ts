import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateHistoryEventInput,
  PhoneHistoryEvent,
  PhoneHistoryEventType,
} from "../types";

const historySelect = {
  id: true,
  listingId: true,
  eventType: true,
  title: true,
  description: true,
  status: true,
  metadata: true,
  source: true,
  sourceId: true,
  occurredAt: true,
  createdAt: true,
} satisfies Prisma.PhoneHistorySelect;

type HistoryRow = Prisma.PhoneHistoryGetPayload<{ select: typeof historySelect }>;

function toHistoryEvent(row: HistoryRow): PhoneHistoryEvent {
  return {
    id: row.id,
    listingId: row.listingId,
    eventType: row.eventType as PhoneHistoryEventType,
    title: row.title,
    description: row.description,
    status: row.status,
    metadata: row.metadata as Record<string, unknown> | null,
    source: row.source,
    sourceId: row.sourceId,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Creates a new phone history event.
 */
export async function createHistoryEvent(
  input: CreateHistoryEventInput,
): Promise<string> {
  const event = await prisma.phoneHistory.create({
    data: {
      listingId: input.listingId,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue,
      source: input.source,
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
    },
    select: { id: true },
  });
  return event.id;
}

/**
 * Gets phone history for a specific listing.
 */
export async function getListingHistory(
  listingId: string,
  limit = 20,
): Promise<PhoneHistoryEvent[]> {
  const rows = await prisma.phoneHistory.findMany({
    where: { listingId },
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: historySelect,
  });
  return rows.map(toHistoryEvent);
}

/**
 * Gets phone history filtered by event type.
 */
export async function getHistoryByEventType(
  eventType: PhoneHistoryEventType,
  limit = 50,
): Promise<PhoneHistoryEvent[]> {
  const rows = await prisma.phoneHistory.findMany({
    where: { eventType },
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: historySelect,
  });
  return rows.map(toHistoryEvent);
}

/**
 * Gets phone history by source (e.g., from inspections).
 */
export async function getHistoryBySource(
  source: string,
  sourceId?: string,
  limit = 50,
): Promise<PhoneHistoryEvent[]> {
  const where: Prisma.PhoneHistoryWhereInput = { source };
  if (sourceId) where.sourceId = sourceId;

  const rows = await prisma.phoneHistory.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: historySelect,
  });
  return rows.map(toHistoryEvent);
}
