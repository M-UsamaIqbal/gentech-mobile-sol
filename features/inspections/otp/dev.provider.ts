import "server-only";

import type { OtpProvider, OtpSendInput, OtpSendResult } from "@/features/inspections/otp/types";

/**
 * Built-in DEV provider used when Twilio credentials are absent. It doesn't send
 * anything — it logs the code to the server console and echoes it back so the UI
 * can surface it, keeping the whole OTP flow testable with no external account.
 */
export const devOtpProvider: OtpProvider = {
  id: "dev",

  isConfigured() {
    return true; // always available as the fallback
  },

  async send({ to, code, channel }: OtpSendInput): Promise<OtpSendResult> {
    console.info(`[otp] DEV provider — would send via ${channel} to ${to}: code ${code}`);
    return { ok: true, devCode: code };
  },
};
