import "server-only";

import {
  createHistoryEvent,
  getHistoryByEventType,
  getHistoryBySource as getHistoryBySourceRepo,
  getListingHistory,
} from "../repositories/phone-history.repository";
import type {
  CreateHistoryEventInput,
  PhoneHistoryEvent,
  PhoneHistoryEventType,
} from "../types";

function warn(scope: string, error: unknown): void {
  console.warn(`[phone-history] ${scope}:`, error instanceof Error ? error.message : error);
}

/**
 * Creates a new phone history event.
 */
export async function addHistoryEvent(
  input: CreateHistoryEventInput,
): Promise<string> {
  try {
    return await createHistoryEvent(input);
  } catch (error) {
    warn("failed to create history event", error);
    throw new Error("Could not create history event.");
  }
}

/**
 * Gets phone history for a listing.
 */
export async function getPhoneHistory(
  listingId: string,
  limit = 20,
): Promise<PhoneHistoryEvent[]> {
  try {
    return await getListingHistory(listingId, limit);
  } catch (error) {
    warn("failed to get listing history", error);
    return [];
  }
}

/**
 * Gets history events by type.
 */
export async function getHistoryByType(
  eventType: PhoneHistoryEventType,
  limit = 50,
): Promise<PhoneHistoryEvent[]> {
  try {
    return await getHistoryByEventType(eventType, limit);
  } catch (error) {
    warn("failed to get history by type", error);
    return [];
  }
}

/**
 * Gets history events by source.
 */
export async function getHistoryBySource(
  source: string,
  sourceId?: string,
  limit = 50,
): Promise<PhoneHistoryEvent[]> {
  try {
    return await getHistoryBySourceRepo(source, sourceId, limit);
  } catch (error) {
    warn("failed to get history by source", error);
    return [];
  }
}
