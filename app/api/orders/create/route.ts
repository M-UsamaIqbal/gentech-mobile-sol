import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createOrder } from "@/features/orders/services/order.service";
import type { CountryCode } from "@/lib/countries/types";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { country, shippingMethodId, zoneId, deliveryAddress, paymentMethod, notes } = body;

    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 });
    }

    const countryCode = country === "BH" ? "BH" : "PK";

    const result = await createOrder({
      customerId: user.id,
      country: countryCode as CountryCode,
      shippingMethodId: shippingMethodId || null,
      zoneId,
      deliveryAddress: deliveryAddress || {},
      paymentMethod,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}