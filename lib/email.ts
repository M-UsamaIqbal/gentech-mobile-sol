import "server-only";

import { env } from "@/lib/env";
import { APP } from "@/lib/constants";

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file content. */
  content: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  /** Plain-text body. */
  text: string;
  /** Optional HTML body; falls back to `text` wrapped in a <pre> if omitted. */
  html?: string;
  /** Optional file attachments (e.g. a PDF quote). */
  attachments?: EmailAttachment[];
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Sends a transactional email.
 *
 * - If `RESEND_API_KEY` is configured, sends via Resend's REST API (no SDK needed).
 * - Otherwise (local dev before email is set up), logs the message to the server
 *   console so flows like verification / password reset remain testable.
 *
 * Returns `true` when the email was dispatched (or logged in dev), `false` on failure.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}: SendEmailParams): Promise<boolean> {
  const from = env.EMAIL_FROM ?? `${APP.name} <onboarding@resend.dev>`;

  if (!env.RESEND_API_KEY) {
    console.info(
      `\n📧 [email:dev] No RESEND_API_KEY set — logging instead of sending.\n` +
        `   To:      ${to}\n` +
        `   Subject: ${subject}\n` +
        `   Body:    ${text}\n` +
        (attachments?.length
          ? `   Files:   ${attachments.map((a) => a.filename).join(", ")}\n`
          : ""),
    );
    return true;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html ?? `<pre style="font-family:inherit">${text}</pre>`,
        ...(attachments?.length ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend responded ${res.status}: ${detail}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Failed to send via Resend:", error);
    return false;
  }
}
