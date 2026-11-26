import "server-only";

import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "../types";

// Valid payment status transitions
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED"],
  PROCESSING: ["SUCCEEDED", "FAILED", "CANCELLED"],
  SUCCEEDED: ["REFUNDED"],
  FAILED: ["PENDING"], // Allow retry
  CANCELLED: [],
  REFUNDED: [],
};

/**
 * Check if a payment status transition is valid.
 */
export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get allowed transitions from current status.
 */
export function getAllowedTransitions(currentStatus: PaymentStatus, _role?: string): PaymentStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Atomically transition a payment to a new status.
 * Uses database-level conditional update to prevent race conditions.
 */
export async function atomicTransitionPayment(
  paymentId: string,
  fromStatus: PaymentStatus,
  toStatus: PaymentStatus,
  data?: {
    providerTransactionId?: string;
    failureReason?: string;
    verifiedAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    refundReason?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  if (!isValidPaymentTransition(fromStatus, toStatus)) {
    return { success: false, error: `Invalid transition from ${fromStatus} to ${toStatus}` };
  }

  try {
    // Use conditional update — only updates if current status matches
    const result = await prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: fromStatus,
      },
      data: {
        status: toStatus,
        ...(data?.providerTransactionId && { providerTransactionId: data.providerTransactionId }),
        ...(data?.failureReason && { failureReason: data.failureReason }),
        ...(data?.verifiedAt && { verifiedAt: data.verifiedAt }),
        ...(data?.refundedAt && { refundedAt: data.refundedAt }),
        ...(data?.refundAmount !== undefined && { refundAmount: data.refundAmount }),
        ...(data?.refundReason && { refundReason: data.refundReason }),
      },
    });

    if (result.count === 0) {
      // Status didn't match — either already transitioned or doesn't exist
      const current = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { status: true },
      });
      if (!current) {
        return { success: false, error: "Payment not found" };
      }
      return {
        success: false,
        error: `Payment already in ${current.status} state (expected ${fromStatus})`,
      };
    }

    // If succeeded, update order payment status
    if (toStatus === "SUCCEEDED") {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { orderId: true },
      });
      if (payment) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "PAID", paidAt: new Date() },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[payment-state] Atomic transition failed:", error);
    return { success: false, error: "Transition failed" };
  }
}

/**
 * Process a webhook with atomic status transition.
 * Prevents duplicate processing and race conditions.
 */
export async function processWebhookAtomic(
  paymentId: string,
  newStatus: PaymentStatus,
  providerTransactionId?: string,
): Promise<{ success: boolean; error?: string; alreadyProcessed?: boolean }> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, orderId: true },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const currentStatus = payment.status as PaymentStatus;

    // Already in target status — idempotent
    if (currentStatus === newStatus) {
      return { success: true, alreadyProcessed: true };
    }

    // Already succeeded — don't overwrite
    if (currentStatus === "SUCCEEDED") {
      return { success: true, alreadyProcessed: true };
    }

    // Validate transition
    if (!isValidPaymentTransition(currentStatus, newStatus)) {
      return { success: false, error: `Invalid transition from ${currentStatus} to ${newStatus}` };
    }

    // Atomic transition
    const result = await atomicTransitionPayment(paymentId, currentStatus, newStatus, {
      providerTransactionId,
      verifiedAt: newStatus === "SUCCEEDED" ? new Date() : undefined,
    });

    return result;
  } catch (error) {
    console.error("[payment-state] Webhook processing failed:", error);
    return { success: false, error: "Processing failed" };
  }
}

/**
 * Refund a payment (prevents duplicate refunds).
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, amount: true, currency: true },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== "SUCCEEDED") {
      return { success: false, error: "Only succeeded payments can be refunded" };
    }

    const refundAmount = amount ?? Number(payment.amount);

    // Atomic transition to REFUNDED
    const result = await atomicTransitionPayment(paymentId, "SUCCEEDED", "REFUNDED", {
      refundedAt: new Date(),
      refundAmount,
      refundReason: reason,
    });

    return result;
  } catch (error) {
    console.error("[payment-state] Refund failed:", error);
    return { success: false, error: "Refund failed" };
  }
}