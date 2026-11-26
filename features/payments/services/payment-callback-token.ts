import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export interface PaymentCallbackTokenPayload {
  paymentId: string;
  orderId: string;
  providerReference: string;
  expiresAt: number;
}

const TOKEN_TTL_SECONDS = 15 * 60;

function callbackSecret(): string {
  return env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "";
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

/**
 * Issues a signed, short-lived token for the simulated payment return path.
 * The token binds the internal payment id to the provider reference, so a
 * browser return cannot nominate an unrelated payment.
 */
export function createPaymentCallbackToken(
  input: Omit<PaymentCallbackTokenPayload, "expiresAt">,
  secret = callbackSecret(),
): string {
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to sign payment callbacks");
  }

  const payload: PaymentCallbackTokenPayload = {
    ...input,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Verifies signature, shape and expiry. Returns null for every invalid token. */
export function verifyPaymentCallbackToken(
  token: string,
  secret = callbackSecret(),
): PaymentCallbackTokenPayload | null {
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded, secret), "utf8");
  const supplied = Buffer.from(signature, "utf8");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;

    const value = parsed as Record<string, unknown>;
    if (
      typeof value.paymentId !== "string" ||
      !value.paymentId ||
      typeof value.orderId !== "string" ||
      !value.orderId ||
      typeof value.providerReference !== "string" ||
      !value.providerReference ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      paymentId: value.paymentId,
      orderId: value.orderId,
      providerReference: value.providerReference,
      expiresAt: value.expiresAt,
    };
  } catch {
    return null;
  }
}
