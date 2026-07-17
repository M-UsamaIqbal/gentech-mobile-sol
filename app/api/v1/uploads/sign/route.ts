import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

/** Folders the app is allowed to upload into (the signature is bound to one of these). */
const ALLOWED_FOLDERS = ["listings", "messages", "inspections"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

function parseFolder(value: unknown): UploadFolder {
  return ALLOWED_FOLDERS.includes(value as UploadFolder) ? (value as UploadFolder) : "listings";
}

/** Issues a short-lived Cloudinary upload signature to authenticated users. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Image uploads are not configured yet." }, { status: 503 });
  }

  // Body is optional → defaults to the "listings" folder (back-compat with the listing uploader).
  const body = (await request.json().catch(() => null)) as { folder?: unknown } | null;
  const folder = parseFolder(body?.folder);

  return NextResponse.json(createUploadSignature(folder));
}
