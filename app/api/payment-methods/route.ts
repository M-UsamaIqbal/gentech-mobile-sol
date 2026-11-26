import { NextResponse } from "next/server";
import { getEnabledPaymentMethods } from "@/lib/payment-config";
import type { CountryCode } from "@/lib/countries/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const country = (url.searchParams.get("country") || "PK") as CountryCode;
    const methods = getEnabledPaymentMethods(country);

    return NextResponse.json({ methods });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load payment methods" }, { status: 500 });
  }
}