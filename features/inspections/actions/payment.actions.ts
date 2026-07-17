"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PAYMENT_METHODS, ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import {
  confirmInspectionPayment,
  startInspectionPayment,
} from "@/features/inspections/services/payment.service";

const SIGN_IN_REQUIRED = "Sign in to pay for your inspection.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

const methodSchema = z.enum([
  PAYMENT_METHODS.JAZZCASH,
  PAYMENT_METHODS.EASYPAISA,
  PAYMENT_METHODS.CARD,
]);

const startSchema = z.object({
  requestId: z.string().min(1),
  method: methodSchema,
});

/** Starts a checkout and returns where to send the buyer. */
export async function startInspectionPaymentAction(input: {
  requestId: string;
  method: string;
}): Promise<{ ok: boolean; checkoutUrl?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select a valid payment method." };

  try {
    const result = await startInspectionPayment(
      parsed.data.requestId,
      user.id,
      parsed.data.method,
    );
    return result;
  } catch (error) {
    console.error("[inspections] start payment failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const confirmSchema = z.object({
  requestId: z.string().min(1),
  method: methodSchema,
  outcome: z.enum(["PAID", "FAILED"]),
});

/** Confirms a (sandbox) payment outcome, marking the request paid or failed. */
export async function confirmInspectionPaymentAction(input: {
  requestId: string;
  method: string;
  outcome: "PAID" | "FAILED";
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

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
  } catch (error) {
    console.error("[inspections] confirm payment failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
