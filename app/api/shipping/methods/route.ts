import { NextResponse } from "next/server";
import { getShippingMethods, getDeliveryZones } from "@/features/shipping/services/shipping.service";
import type { CountryCode } from "@/lib/countries/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const country = (url.searchParams.get("country") || "PK") as CountryCode;
    const includeZones = url.searchParams.get("zones") === "true";

    const methods = await getShippingMethods(country);
    const zones = includeZones ? await getDeliveryZones(country) : [];

    return NextResponse.json({ methods, zones });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load shipping methods" }, { status: 500 });
  }
}