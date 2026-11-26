import { NextResponse } from "next/server";
import { sendOTP, sendOTPEndpoint } from "@//lib/otp";

// POST /api/otp/send - Send OTP to phone number
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, type } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const otpType = type ? (type as ("login" | "registration" | "phone_verification" | "password_reset")) : "login";

    const result = await sendOTPEndpoint(phone, otpType);

    if (result.success) {
      // In a real app, never return the code directly to the client.
      // Instead, instruct the client to check via the verify endpoint.
      // Here we return a success marker; the frontend should call /api/otp/verify
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // ⚠️ DO NOT return the code in production — this is a demo placeholder
        code: process.env.NODE_ENV === "development" ? result.code : undefined,
        expiresAt: result.expiresAt,
        type: result.type,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send OTP" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[OTP send] Error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}