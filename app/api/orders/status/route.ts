import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { transitionOrderStatus, getAllowedTransitions, type OrderStatus } from "@/features/orders/services/order-status.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, newStatus, trackingNumber } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: "Order ID and new status are required" }, { status: 400 });
    }

    const role = user.role || "USER";
    const result = await transitionOrderStatus(
      orderId,
      newStatus,
      user.id,
      role,
      trackingNumber,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await (await import("@/lib/prisma")).prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const role = user.role || "USER";
    const allowed = getAllowedTransitions(order.status as OrderStatus, role);

    return NextResponse.json({ currentStatus: order.status, allowedTransitions: allowed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get transitions" }, { status: 500 });
  }
}