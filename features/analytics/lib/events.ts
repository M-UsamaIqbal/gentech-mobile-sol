import { track } from "@/features/analytics/lib/client";
import { ANALYTICS_EVENTS } from "@/features/analytics/lib/event-names";

export { ANALYTICS_EVENTS } from "@/features/analytics/lib/event-names";

/**
 * Canonical event helpers. Centralising names keeps event naming consistent across
 * the app (and across vendors) and makes instrumentation greppable.
 */

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
}

export function trackSearch(query: string, city?: string): void {
  track(ANALYTICS_EVENTS.SEARCH, { query, ...(city ? { city } : {}) });
}

export function trackViewListing(input: {
  id: string;
  title: string;
  price: number;
  category?: string;
}): void {
  track(ANALYTICS_EVENTS.VIEW_LISTING, input);
}

export function trackStartChat(listingId: string): void {
  track(ANALYTICS_EVENTS.START_CHAT, { listingId });
}

export function trackCreateListing(input: { id: string; price: number }): void {
  track(ANALYTICS_EVENTS.CREATE_LISTING, input);
}

export function trackSaveSearch(query: string): void {
  track(ANALYTICS_EVENTS.SAVE_SEARCH, { query });
}

export function trackToggleFavorite(listingId: string, favorite: boolean): void {
  track(ANALYTICS_EVENTS.TOGGLE_FAVORITE, { listingId, favorite });
}

export function trackBeginCheckout(input: {
  value: number;
  currency: string;
  items: AnalyticsItem[];
}): void {
  track(ANALYTICS_EVENTS.BEGIN_CHECKOUT, input);
}

export function trackPurchase(input: {
  orderId: string;
  value: number;
  currency: string;
  items: AnalyticsItem[];
}): void {
  track(ANALYTICS_EVENTS.PURCHASE, { transaction_id: input.orderId, ...input });
}
