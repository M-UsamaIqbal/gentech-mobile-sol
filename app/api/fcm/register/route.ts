import { NextResponse } from "next/server";
import { sendFcmMessage } from "@/lib/fcm.service";

// FCM token registration endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, userId, device } = body;

    if (!token) {
      return NextResponse.json(
        { error: "FCM token is required" },
        { status: 400 }
      );
    }

    // In a production app, you would:
    // 1. Validate the user is authenticated
    // 2. Save the token to your database associated with the user
    // 3. Associate the token with the user's role and permissions

    // For now, we acknowledge the registration
    console.log("[FCM] Token registered:", token.substring(0, 20) + "...");

    return NextResponse.json({
      success: true,
      message: "FCM token registered successfully",
      tokenLength: token.length,
    });
  } catch (error) {
    console.error("[FCM] Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register FCM token" },
      { status: 500 }
    );
  }
}

// FCM test endpoint - send a test notification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const testTitle = searchParams.get("title") || "Test Notification";
    const testBody = searchParams.get("body") || "This is a test push notification";

    if (!token) {
      return NextResponse.json(
        { error: "FCM token is required" },
        { status: 400 }
      );
    }

    const result = await sendFcmMessage({
      token,
      title: testTitle,
      body: testBody,
      data: { type: "test", source: "fcm-test" },
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error("[FCM] Test send error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}