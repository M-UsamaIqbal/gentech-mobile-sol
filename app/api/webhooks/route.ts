import { NextResponse } from "next/server";

type WebhookEvent =
  | "payment.success"
  | "payment.failed"
  | "order.status.change"
  | "inspection.completed"
  | "dealer.approved"
  | "dealer.rejected"
  | "listing.sold";

type WebhookPayload = {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
};

export async function POST(request: Request) {
  try {
    const payload: WebhookPayload = await request.json();

    if (!payload.event) {
      return NextResponse.json(
        { error: "Webhook event is required" },
        { status: 400 }
      );
    }

    // Verify signature if present (placeholder - implement based on provider secret)
    if (payload.signature) {
      console.log(
        "[Webhook] Signature verification placeholder - implement based on",
        "provider secret"
      );
    }

    // Route to handlers based on event type
    switch (payload.event) {
      case "payment.success": {
        console.log(
          "[Webhook] Payment succeeded:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "payment.failed": {
        console.log(
          "[Webhook] Payment failed:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "order.status.change": {
        console.log(
          "[Webhook] Order status changed:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "inspection.completed": {
        console.log(
          "[Webhook] Inspection completed:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "dealer.approved": {
        console.log(
          "[Webhook] Dealer approved:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "dealer.rejected": {
        console.log(
          "[Webhook] Dealer rejected:",
          JSON.stringify(payload.data)
        );
        break;
      }
      case "listing.sold": {
        console.log(
          "[Webhook] Listing sold:",
          JSON.stringify(payload.data)
        );
        break;
      }
      default:
        console.log(
          "[Webhook] Unknown event:",
          payload.event,
          "- data:",
          JSON.stringify(payload.data)
        );
    }

    return NextResponse.json({
      success: true,
      event: payload.event,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 400 }
    );
  }
}