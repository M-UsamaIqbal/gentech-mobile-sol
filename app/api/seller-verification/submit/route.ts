import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { submitVerification } from "@/features/seller-verification/services/seller-verification.service";
import type { CountryCode } from "@/lib/countries/types";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { country, documents } = body;

    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 });
    }

    const countryCode = country === "BH" ? "BH" : "PK";
    const docs = typeof documents === "string"
      ? documents.split(",").map((d: string) => d.trim()).filter(Boolean)
      : Array.isArray(documents) ? documents : [];

    const result = await submitVerification(user.id, countryCode as CountryCode, docs);

    if (!result) {
      return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
    }

    return NextResponse.json({ success: true, verification: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }
}