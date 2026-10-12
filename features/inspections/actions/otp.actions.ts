"use server";

import { z } from "zod";

import type { OtpChannel } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { sendPhoneOtp, verifyPhoneOtp } from "@/features/inspections/otp/otp.service";

type SendResult = { ok: boolean; error?: string; channel?: OtpChannel; devCode?: string };
type VerifyResult = { ok: boolean; error?: string };

const SIGN_IN_REQUIRED = "Sign in to book an inspection.";

const phoneSchema = z.object({ phone: z.string().trim().min(7).max(20) });
const verifySchema = z.object({
  phone: z.string().trim().min(7).max(20),
  code: z.string().trim().min(4).max(8),
});

/** Sends a one-time code to the buyer's number so they can verify it. */
export async function sendBookingOtpAction(input: { phone: string }): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  if (!user.emailVerified) {
    return { ok: false, error: "Please verify your email before booking an inspection." };
  }

  const parsed = phoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid phone number." };

  try {
    const result = await sendPhoneOtp(user.id, parsed.data.phone);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, channel: result.channel, devCode: result.devCode };
  } catch (error) {
    console.error("[inspections] send OTP failed:", error);
    return { ok: false, error: "Could not send the code. Please try again." };
  }
}

/** Verifies the code the buyer received. */
export async function verifyBookingOtpAction(input: {
  phone: string;
  code: string;
}): Promise<VerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter the code we sent you." };

  try {
    const result = await verifyPhoneOtp(user.id, parsed.data.phone, parsed.data.code);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  } catch (error) {
    console.error("[inspections] verify OTP failed:", error);
    return { ok: false, error: "Could not verify the code. Please try again." };
  }
}
