/**
 * SMS-OTP (One-Time Password) service.
 * Free/simulated implementation that works without paid SMS providers.
 *
 * Features:
 * - Generate 6-digit OTP codes
 * - Verify OTP codes
 * - Time-based expiry (5 minutes default)
 * - Max attempts (3 default)
 * - Console logging in development
 * - Ready to integrate with Twilio/similar when configured
 *
 * Pattern: Same as email (lib/email.ts), WhatsApp (lib/whatsapp.ts),
 *          and FCM (lib/fcm.service.ts) — works without config, configurable later.
 */

// ---------------------------------------------------------------------------
// OTP Types
// ---------------------------------------------------------------------------

/** OTP type values */
export type OTPType = "login" | "registration" | "phone_verification" | "password_reset";

 /** OTP record interface */
export interface OTP {
  id: string;
  code: string;
  type: OTPType;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  userId?: string;
}

// ---------------------------------------------------------------------------
// OTP Service
// ---------------------------------------------------------------------------

/** In-memory OTP store (replace with Redis/db in production) */
const otpStore = new Map<string, OTP>();

/** Generate a 6-digit OTP code */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Get the store key for a phone + type combination */
function getStoreKey(phone: string, type: OTPType): string {
  return `${type}-${phone}`;
}

/** Send OTP to phone number */
export async function sendOTP(
  phone: string,
  type: OTPType = "login"
): Promise<OTP> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const otp: OTP = {
    id: `${Date.now()}-${phone}-${type}`,
    code,
    type,
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
  };

  // Store the OTP
  const storeKey = getStoreKey(phone, type);
  otpStore.set(storeKey, otp);

  // Simulate sending — console log in dev, would be SMS API call in production
  console.log(`[OTP] Code ${code} sent to ${phone} (type: ${type}, expires: ${expiresAt.toISOString()})`);

  return otp;
}

/** Verify an OTP code */
export function verifyOTP(
  phone: string,
  code: string,
  type: OTPType = "login"
): { valid: boolean; otp?: OTP; attempts?: number } {
  const storeKey = getStoreKey(phone, type);
  const otp = otpStore.get(storeKey);

  if (!otp) {
    return { valid: false };
  }

  // Check if expired
  if (new Date() > otp.expiresAt) {
    otpStore.delete(storeKey);
    return { valid: false };
  }

  // Check max attempts
  if (otp.attempts >= otp.maxAttempts) {
    return { valid: false, attempts: otp.attempts };
  }

  // Increment attempts
  otp.attempts++;

  // Verify code
  if (otp.code !== code) {
    return { valid: false, attempts: otp.attempts };
  }

  // Code is valid — optionally remove the OTP after first use
  // otpStore.delete(storeKey);

  return { valid: true, otp, attempts: otp.attempts };
}

/** Resend OTP */
export async function resendOTP(phone: string, type: OTPType = "login"): Promise<OTP> {
  // Remove existing OTP for this phone/type
  const storeKey = getStoreKey(phone, type);
  otpStore.delete(storeKey);

  // Send new OTP
  return sendOTP(phone, type);
}

// ---------------------------------------------------------------------------
// OTP Endpoints
// ---------------------------------------------------------------------------

/** Send OTP endpoint */
export async function sendOTPEndpoint(phone: string, type?: string) {
  "server-only";

  const otpType = type ? (type as OTPType) : "login";

  try {
    const otp = await sendOTP(phone, otpType);
    return {
      success: true,
      code: otp.code, // In production, never return the code directly —
      // instead verify it via the verify endpoint
      type: otp.type,
      expiresAt: otp.expiresAt,
    };
  } catch (error) {
    console.error("[OTP] Send error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/** Verify OTP endpoint */
export async function verifyOTPEndpoint(phone: string, code: string, type?: string) {
  "server-only";

  try {
    const result = verifyOTP(phone, code, type as OTPType | undefined);

    if (result.valid) {
      return {
        success: true,
        valid: true,
        otpId: result.otp?.id,
        attempts: result.attempts,
      };
    } else {
      return {
        success: true,
        valid: false,
        attempts: result.attempts,
        message:
          result.attempts !== undefined
            ? `Maximum attempts (${result.attempts}) exceeded`
            : "Invalid or expired OTP",
      };
    }
  } catch (error) {
    console.error("[OTP] Verify error:", error);
    return {
      success: false,
      valid: false,
      error: (error as Error).message,
    };
  }
}