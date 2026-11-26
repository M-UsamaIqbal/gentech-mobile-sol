import { NextResponse } from "next/server";
import { calculateCheckout } from "@/features/checkout/services/checkout.service";
import type { CountryCode } from "@/lib/countries/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { country, subtotal, shippingMethodId, zoneId, discount } = body;

    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json({ error: "Valid subtotal is required" }, { status: 400 });
    }

    const countryCode = country === "BH" ? "BH" : "PK";
    const result = await calculateCheckout(
      countryCode as CountryCode,
      subtotal,
      shippingMethodId || null,
      zoneId,
      discount || 0,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate checkout" }, { status: 500 });
  }
}