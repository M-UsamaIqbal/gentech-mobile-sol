import "server-only";

import type { WebhookPayload } from "../types";

const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

/** Canonical signed representation shared by the route and provider adapters. */
export function buildWebhookSignaturePayload(payload: Omit<WebhookPayload, "signature">): string {
  return JSON.stringify({
    provider: payload.provider,
    event: payload.event,
    data: payload.data,
    timestamp: payload.timestamp,
  });
}

export function isFreshWebhookTimestamp(timestamp: string | undefined, now = Date.now()): boolean {
  if (!timestamp) return false;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return false;
  const age = Math.abs(now - parsed);
  return age <= WEBHOOK_MAX_AGE_MS;
}
