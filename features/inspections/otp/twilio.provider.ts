import "server-only";

import { OTP_CHANNELS } from "@/lib/constants";
import { env } from "@/lib/env";
import type { OtpProvider, OtpSendInput, OtpSendResult } from "@/features/inspections/otp/types";

/**
 * Twilio provider — sends the OTP over SMS or WhatsApp via the Messages API.
 * Activates only when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER
 * are set; otherwise the app falls back to the dev provider.
 *
 * Uses `fetch` + Basic auth (no SDK dependency). For WhatsApp, both the sender
 * and recipient are prefixed with `whatsapp:` per Twilio's addressing scheme.
 */
export const twilioProvider: OtpProvider = {
  id: "twilio",

  isConfigured() {
    return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
  },

  async send({ to, body, channel }: OtpSendInput): Promise<OtpSendResult> {
    const sid = env.TWILIO_ACCOUNT_SID;
    const token = env.TWILIO_AUTH_TOKEN;
    const from = env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      return { ok: false, error: "Twilio is not configured." };
    }

    const whatsApp = channel === OTP_CHANNELS.WHATSAPP;
    const toAddr = whatsApp ? `whatsapp:${to}` : to;
    const fromAddr = whatsApp && !from.startsWith("whatsapp:") ? `whatsapp:${from}` : from;

    const params = new URLSearchParams({ To: toAddr, From: fromAddr, Body: body });
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[otp] Twilio send failed (${res.status}): ${detail.slice(0, 300)}`);
        return { ok: false, error: "We couldn't send the code right now. Please try again." };
      }
      return { ok: true };
    } catch (error) {
      console.error("[otp] Twilio request error:", error);
      return { ok: false, error: "We couldn't send the code right now. Please try again." };
    }
  },
};
