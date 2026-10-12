import "server-only";

import { createHash, randomInt } from "node:crypto";

import { APP, OTP, OTP_CHANNELS, type OtpChannel } from "@/lib/constants";
import { env } from "@/lib/env";
import { normalizePhone } from "@/utils/phone";
import { getOtpProvider } from "@/features/inspections/otp";
import {
  getPhoneVerification,
  incrementPhoneVerificationAttempts,
  isPhoneVerifiedSince,
  markPhoneVerified,
  upsertPhoneVerification,
} from "@/features/inspections/repositories/phone-verification.repository";

export type OtpResult =
  | { ok: true; channel: OtpChannel; devCode?: string }
  | { ok: false; error: string };

/** Non-reversible hash of a code, salted with the user id + app secret. */
function hashCode(code: string, userId: string): string {
  return createHash("sha256").update(`${code}:${userId}:${env.BETTER_AUTH_SECRET}`).digest("hex");
}

/** Cryptographically-random numeric code of the configured length. */
function generateCode(): string {
  const code = randomInt(0, 10 ** OTP.length);
  return code.toString().padStart(OTP.length, "0");
}

function resolveChannel(): OtpChannel {
  return env.TWILIO_OTP_CHANNEL === OTP_CHANNELS.WHATSAPP
    ? OTP_CHANNELS.WHATSAPP
    : OTP_CHANNELS.SMS;
}

/** Generates + stores a fresh code and delivers it via the active provider. */
export async function sendPhoneOtp(userId: string, rawPhone: string): Promise<OtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid phone number." };

  // Throttle resends to the same number.
  const existing = await getPhoneVerification(userId, phone);
  if (existing && !existing.verified) {
    const elapsed = (Date.now() - existing.updatedAt.getTime()) / 1000;
    if (elapsed < OTP.resendCooldownSeconds) {
      const wait = Math.ceil(OTP.resendCooldownSeconds - elapsed);
      return { ok: false, error: `Please wait ${wait}s before requesting another code.` };
    }
  }

  const code = generateCode();
  const channel = resolveChannel();
  const expiresAt = new Date(Date.now() + OTP.ttlMinutes * 60_000);

  await upsertPhoneVerification({
    userId,
    phone,
    codeHash: hashCode(code, userId),
    channel,
    expiresAt,
  });

  const body = `Your ${APP.name} verification code is ${code}. It expires in ${OTP.ttlMinutes} minutes.`;
  const result = await getOtpProvider().send({ to: phone, code, body, channel });
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Could not send the code. Please try again." };
  }

  return { ok: true, channel, devCode: result.devCode };
}

/** Checks a submitted code against the live record for (user, phone). */
export async function verifyPhoneOtp(
  userId: string,
  rawPhone: string,
  code: string,
): Promise<OtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid phone number." };

  const row = await getPhoneVerification(userId, phone);
  if (!row) return { ok: false, error: "Request a code first." };
  if (row.verified) return { ok: true, channel: row.channel as OtpChannel };
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "The code has expired. Request a new one." };
  }
  if (row.attempts >= OTP.maxAttempts) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const submitted = code.replace(/\D/g, "");
  if (hashCode(submitted, userId) !== row.codeHash) {
    const attempts = await incrementPhoneVerificationAttempts(row.id);
    const left = Math.max(0, OTP.maxAttempts - attempts);
    return {
      ok: false,
      error: left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Too many attempts. Request a new code.",
    };
  }

  await markPhoneVerified(row.id, new Date());
  return { ok: true, channel: row.channel as OtpChannel };
}

/** True when the buyer has a fresh verification for this number (booking gate). */
export async function isPhoneVerifiedForBooking(
  userId: string,
  rawPhone: string,
): Promise<boolean> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return false;
  const since = new Date(Date.now() - OTP.validForMinutes * 60_000);
  return isPhoneVerifiedSince(userId, phone, since);
}
