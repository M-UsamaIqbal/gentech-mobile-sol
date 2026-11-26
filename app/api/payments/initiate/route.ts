import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { initiatePayment } from "@/features/payments/services/payment.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, providerId, idempotencyKey } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const result = await initiatePayment({ orderId, providerId, idempotencyKey });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 500 });
  }
}