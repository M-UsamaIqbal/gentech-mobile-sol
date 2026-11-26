"use server";

import { isIP } from "node:net";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { PAYMENT_METHODS, ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import {
  checkPayFastInspectionPayment,
  completePayFastInspectionPayment,
  confirmInspectionPayment,
  startPayFastInspectionPayment,
} from "@/features/inspections/services/payment.service";
import { getPayFastConfiguredMethod, PayFastError } from "@/features/inspections/payments/payfast.provider";
import { getPaymentProvider } from "@/features/inspections/payments";
import type { PayFastPaymentDetails } from "@/features/inspections/payments/types";

const SIGN_IN_REQUIRED = "Sign in to pay for your inspection.";
const GENERIC_ERROR = "Payment could not be processed. Please check the status before trying again.";

const mobileNumberSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[\d+\-()\s]+$/);

const cardDetailsSchema = z.object({
  method: z.literal(PAYMENT_METHODS.CARD),
  mobileNumber: mobileNumberSchema,
  cardNumber: z
    .string()
    .trim()
    .regex(/^[\d -]+$/)
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 13 && value.length <= 19),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiryYear: z
    .string()
    .regex(/^\d{2}(\d{2})?$/)
    .transform((value) => (value.length === 2 ? `20${value}` : value)),
  cvv: z.string().regex(/^\d{3,4}$/),
});

const walletDetailsSchema = z.object({
  method: z.enum([PAYMENT_METHODS.JAZZCASH, PAYMENT_METHODS.EASYPAISA]),
  mobileNumber: mobileNumberSchema,
  accountNumber: z
    .string()
    .trim()
    .regex(/^[\d -]{4,30}$/)
    .transform((value) => value.replace(/\D/g, "")),
  cnicNumber: z
    .string()
    .trim()
    .regex(/^[\d -]{13,17}$/)
    .transform((value) => value.replace(/\D/g, "")),
  accountTitle: z.string().trim().max(100).optional(),
});

const paymentDetailsSchema = z.discriminatedUnion("method", [
  cardDetailsSchema,
  walletDetailsSchema,
]);

const beginSchema = z.object({
  requestId: z.string().trim().min(1).max(100),
  details: paymentDetailsSchema,
});

const continuationSchema = z.object({
  requestId: z.string().trim().min(1).max(100),
  continuation: z.string().min(1).max(8192),
  otp: z.string().trim().regex(/^\d{4,8}$/).optional(),
  paRes: z.string().max(12_000).optional(),
});

const statusSchema = z.object({ requestId: z.string().trim().min(1).max(100) });

async function getCustomerIp(): Promise<string | null> {
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = requestHeaders.get("x-real-ip")?.trim() || forwardedIp;
  return candidate && isIP(candidate) !== 0 ? candidate : null;
}

function logPayFastFailure(scope: string, error: unknown): void {
  const code = error instanceof PayFastError ? error.code : "UNEXPECTED";
  console.error(`[inspections] PayFast ${scope} failed (${code}).`);
}

export async function beginPayFastInspectionPaymentAction(input: {
  requestId: string;
  details: PayFastPaymentDetails;
}): Promise<
  | { ok: true; challenge: Awaited<ReturnType<typeof startPayFastInspectionPayment>> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = beginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter valid payment details." };
  if (getPaymentProvider()?.id !== "payfast") {
    return { ok: false, error: "PayFast is not enabled for this environment." };
  }
  if (!getPayFastConfiguredMethod(parsed.data.details.method)) {
    return { ok: false, error: "This payment method is not configured for PayFast." };
  }

  const customerIp = await getCustomerIp();
  if (!customerIp) {
    return { ok: false, error: "A verified network address is required to start payment." };
  }

  try {
    const challenge = await startPayFastInspectionPayment({
      requestId: parsed.data.requestId,
      requesterId: user.id,
      customerIp,
      details: parsed.data.details,
    });
    return { ok: true, challenge };
  } catch (error) {
    logPayFastFailure("begin", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function completePayFastInspectionPaymentAction(input: {
  requestId: string;
  continuation: string;
  otp?: string;
  paRes?: string;
}): Promise<
  | { ok: true; status: "PAID" | "FAILED" | "PENDING" }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = continuationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Payment verification data is invalid." };
  if (getPaymentProvider()?.id !== "payfast") {
    return { ok: false, error: "PayFast is not enabled for this environment." };
  }

  const customerIp = await getCustomerIp();
  if (!customerIp) {
    return { ok: false, error: "A verified network address is required to verify payment." };
  }

  try {
    const status = await completePayFastInspectionPayment({
      requestId: parsed.data.requestId,
      requesterId: user.id,
      customerIp,
      continuation: parsed.data.continuation,
      otp: parsed.data.otp,
      paRes: parsed.data.paRes,
    });
    if (status !== "PENDING") revalidatePath(ROUTES.inspections);
    return { ok: true, status };
  } catch (error) {
    logPayFastFailure("verification", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function checkPayFastInspectionPaymentAction(input: {
  requestId: string;
}): Promise<
  | { ok: true; status: "PAID" | "FAILED" | "PENDING" }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment reference." };
  if (getPaymentProvider()?.id !== "payfast") {
    return { ok: false, error: "PayFast is not enabled for this environment." };
  }

  const customerIp = await getCustomerIp();
  if (!customerIp) {
    return { ok: false, error: "A verified network address is required to check payment." };
  }

  try {
    const status = await checkPayFastInspectionPayment({
      requestId: parsed.data.requestId,
      requesterId: user.id,
      customerIp,
    });
    if (status !== "PENDING") revalidatePath(ROUTES.inspections);
    return { ok: true, status };
  } catch (error) {
    logPayFastFailure("status check", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const sandboxSchema = z.object({
  requestId: z.string().trim().min(1).max(100),
  method: z.enum([
    PAYMENT_METHODS.JAZZCASH,
    PAYMENT_METHODS.EASYPAISA,
    PAYMENT_METHODS.CARD,
  ]),
  outcome: z.enum(["PAID", "FAILED"]),
});

/** Allows mock outcomes only when the non-production sandbox provider is active. */
export async function confirmInspectionPaymentAction(input: {
  requestId: string;
  method: string;
  outcome: "PAID" | "FAILED";
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = sandboxSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid sandbox payment data." };
  if (getPaymentProvider()?.id !== "sandbox") {
    return { ok: false, error: "Client-submitted outcomes are not accepted for real payments." };
  }

  try {
    const paid = await confirmInspectionPayment(
      parsed.data.requestId,
      user.id,
      parsed.data.method,
      parsed.data.outcome,
    );
    revalidatePath(ROUTES.inspections);
    if (!paid) return { ok: false, error: "Payment was not completed." };
    return { ok: true };
  } catch {
    console.error("[inspections] sandbox payment confirmation failed.");
    return { ok: false, error: "Sandbox payment could not be confirmed." };
  }
}
