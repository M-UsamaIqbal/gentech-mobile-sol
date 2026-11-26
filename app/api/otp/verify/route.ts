import { NextResponse } from "next/server";
import { verifyOTP, verifyOTPEndpoint } from "@//lib/otp";

// POST /api/otp/verify - Verify OTP code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, type } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }

    const otpType = type ? (type as ("login" | "registration" | "phone_verification" | "password_reset")) : "login";

    const result = await verifyOTPEndpoint(phone, code, otpType);

    if (result.success && result.valid) {
      return NextResponse.json({
        success: true,
        valid: true,
        message: "OTP verified successfully",
        attempts: result.attempts,
      });
    } else {
      return NextResponse.json({
        success: true,
        valid: false,
        message:
          result.attempts !== undefined
            ? `Maximum attempts (${result.attempts}) exceeded`
            : "Invalid or expired OTP",
        attempts: result.attempts,
      });
    }
  } catch (error) {
    console.error("[OTP verify] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}