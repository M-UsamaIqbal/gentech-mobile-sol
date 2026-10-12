import "server-only";

import { devOtpProvider } from "@/features/inspections/otp/dev.provider";
import { twilioProvider } from "@/features/inspections/otp/twilio.provider";
import type { OtpProvider } from "@/features/inspections/otp/types";

/**
 * Resolves the active OTP delivery channel: Twilio when it's configured,
 * otherwise the built-in dev provider so the flow stays testable locally.
 */
export function getOtpProvider(): OtpProvider {
  return twilioProvider.isConfigured() ? twilioProvider : devOtpProvider;
}

export type { OtpProvider, OtpSendInput, OtpSendResult } from "@/features/inspections/otp/types";
