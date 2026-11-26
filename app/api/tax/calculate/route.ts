import { NextResponse } from "next/server";
import { calculateTax } from "@/lib/tax";
import type { CountryCode } from "@/lib/countries/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, country } = body;

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const countryCode = country === "BH" ? "BH" : "PK";
    const result = calculateTax(amount, countryCode as CountryCode);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 });
  }
}