import { NextResponse } from "next/server";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

// POST: Get Cloudinary upload signature (for direct browser uploads)
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "listings";

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured." },
        { status: 500 }
      );
    }

    const signature = createUploadSignature(folder);

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error("[Cloudinary] Upload signature error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}

// GET: Check Cloudinary configuration status
export async function GET(request: Request) {
  try {
    const configured = isCloudinaryConfigured();

    return NextResponse.json({
      configured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    });
  } catch (error) {
    console.error("[Cloudinary] Config check error:", error);
    return NextResponse.json(
      { error: "Failed to check Cloudinary configuration" },
      { status: 500 }
    );
  }
}