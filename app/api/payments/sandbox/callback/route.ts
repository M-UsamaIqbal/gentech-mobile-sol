import { NextResponse } from "next/server";
import { verifyPayment } from "@/features/payments/services/payment.service";
import { verifyPaymentCallbackToken } from "@/features/payments/services/payment-callback-token";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Simulated provider return. Only a server-issued signed token can reach the
 * verification service, so a visitor cannot nominate another payment id.
 */
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const payload = token ? verifyPaymentCallbackToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired payment token" }, { status: 400 });
    }

    const result = await verifyPayment(payload.paymentId, payload.providerReference);
    const outcome = result.success ? "success" : "failed";
    return NextResponse.redirect(
      `${APP_URL}/dashboard/orders?payment=${outcome}&orderId=${encodeURIComponent(payload.orderId)}`,
    );
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/orders?payment=error`);
  }
}
