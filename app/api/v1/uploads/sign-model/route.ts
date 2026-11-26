import { NextResponse } from "next/server";

import { createRawUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/session";

/**
 * Issues a signed raw-upload grant whose Cloudinary folder is bound to the
 * authenticated seller. The signed folder becomes the public_id prefix, so a
 * client cannot associate another seller's model with its listing.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Model uploads are not configured yet." }, { status: 503 });
  }

  return NextResponse.json(createRawUploadSignature(`models/${user.id}`));
}
