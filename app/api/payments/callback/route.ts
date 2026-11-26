import { NextResponse } from "next/server";
import { z } from "zod";
import { processWebhook } from "@/features/payments/services/payment.service";
import type { WebhookPayload } from "@/features/payments/types";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const MAX_BODY_BYTES = 16_384;

const webhookSchema = z.object({
  provider: z.enum(["benefitpay", "jazzcash", "easypaisa", "sandbox"]),
  event: z.string().min(1).max(128),
  data: z.record(z.string(), z.unknown()),
  signature: z.string().min(1).max(512).optional(),
  timestamp: z.string().min(1).max(64).optional(),
});

/**
 * Browser return endpoint. It is deliberately read-only: payment state is
 * changed only by the signed webhook handler below or the signed sandbox
 * return route. A browser query string can never mark an order as paid.
 */
export async function GET() {
  return NextResponse.redirect(`${APP_URL}/dashboard/orders?payment=pending`);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const payload: WebhookPayload = {
      provider: parsed.data.provider,
      event: parsed.data.event,
      data: parsed.data.data,
      ...(parsed.data.signature && { signature: parsed.data.signature }),
      ...(parsed.data.timestamp && { timestamp: parsed.data.timestamp }),
    };

    const result = await processWebhook(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
