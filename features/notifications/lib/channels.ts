import "server-only";

import { APP } from "@/lib/constants";
import { APP_URL } from "@/lib/app-url";
import type { NotificationType } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

/**
 * Out-of-band notification delivery, behind an interface.
 *
 * Phase 9 decision: in-app notifications are always persisted (the inbox is the
 * source of truth); external delivery — email today, Firebase Cloud Messaging push
 * later — is abstracted as a `NotificationChannel` so new transports drop in without
 * touching the dispatch flow.
 */
export interface NotificationDelivery {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Absolute or app-relative URL the notification points to. */
  url?: string;
  /** Recipient contact, resolved by the service for channels that need it. */
  recipientEmail?: string;
  recipientName?: string;
  /** Whether the caller wants an email for this notification. */
  email?: boolean;
}

export interface NotificationChannel {
  readonly name: string;
  /** Best-effort delivery; channels must never throw (they swallow + log). */
  deliver(payload: NotificationDelivery): Promise<void>;
}

const emailChannel: NotificationChannel = {
  name: "email",
  async deliver(payload) {
    if (!payload.email || !payload.recipientEmail) return;
    const link = !payload.url
      ? APP_URL
      : payload.url.startsWith("http")
        ? payload.url
        : `${APP_URL}${payload.url}`;
    const text = `${payload.body ?? payload.title}\n\nOpen ${APP.name}: ${link}`;
    try {
      await sendEmail({ to: payload.recipientEmail, subject: payload.title, text });
    } catch (error) {
      console.error("[notifications:email] delivery failed:", error);
    }
  },
};

/** FCM push is not configured until Firebase creds + device-token storage exist. */
export function isPushConfigured(): boolean {
  return false;
}

const pushChannel: NotificationChannel = {
  name: "push",
  async deliver() {
    // Designed behind the interface; a future implementation will look up the
    // recipient's device tokens (requires a DeviceToken model + FIREBASE_* env)
    // and POST to the FCM HTTP v1 API. Skipped silently until then.
    if (!isPushConfigured()) return;
  },
};

/** External channels fanned out after the in-app notification is stored. */
export const externalChannels: NotificationChannel[] = [emailChannel, pushChannel];
