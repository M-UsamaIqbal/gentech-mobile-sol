import "server-only";

import { APP, NOTIFICATION_TYPES, ROUTES, type PaymentMethod } from "@/lib/constants";
import { dispatchNotification } from "@/features/notifications/services/notification.service";
import { getPaymentProvider } from "@/features/inspections/payments";
import {
  getPayableRequest,
  markRequestPaid,
  markRequestPaymentFailed,
  recordPaymentIntent,
} from "@/features/inspections/repositories/inspection.repository";

export interface StartPaymentResult {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Starts a checkout for the inspection fee. Validates ownership + that the request
 * is still unpaid, asks the active gateway (sandbox or real aggregator) for a
 * checkout URL, records the intent, and returns where to send the buyer.
 */
export async function startInspectionPayment(
  requestId: string,
  requesterId: string,
  method: PaymentMethod,
): Promise<StartPaymentResult> {
  const request = await getPayableRequest(requestId, requesterId);
  if (!request) {
    return { ok: false, error: "This inspection is not awaiting payment." };
  }

  const provider = getPaymentProvider();
  const session = await provider.createCheckout({
    requestId: request.id,
    amount: request.feeAmount,
    currency: request.currency,
    method,
    customerName: request.contactName ?? undefined,
    customerPhone: request.contactPhone ?? undefined,
    returnUrl: `${APP.url}${ROUTES.inspections}`,
  });

  await recordPaymentIntent(request.id, requesterId, session.reference, method);

  return { ok: true, checkoutUrl: session.checkoutUrl };
}

/**
 * Confirms the outcome of a payment (from the sandbox checkout or a real gateway
 * return). On success marks the request paid and notifies the buyer.
 */
export async function confirmInspectionPayment(
  requestId: string,
  requesterId: string,
  method: PaymentMethod,
  outcome: "PAID" | "FAILED",
): Promise<boolean> {
  const provider = getPaymentProvider();
  const verified = await provider.verify({
    reference: `SANDBOX-${requestId}`,
    outcome,
  });

  if (verified.status !== "PAID") {
    await markRequestPaymentFailed(requestId, requesterId);
    return false;
  }

  const ok = await markRequestPaid(requestId, requesterId, method);
  if (ok) {
    await dispatchNotification({
      userId: requesterId,
      type: NOTIFICATION_TYPES.INSPECTION_SCHEDULED,
      title: "Payment received",
      body: "We've received your inspection payment. Your slot is confirmed.",
      url: ROUTES.inspections,
      email: true,
    }).catch(() => {
      /* best-effort */
    });
  }
  return ok;
}
