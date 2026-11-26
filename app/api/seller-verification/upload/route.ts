import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENT_COUNT,
  validateDocument,
  validateDocumentCount,
  isDocumentStorageConfigured,
  uploadDocumentToCloudinary,
} from "@/features/document-storage/services/document.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate count
    const countValidation = validateDocumentCount(files.length);
    if (!countValidation.valid) {
      return NextResponse.json({ error: countValidation.error }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      const validation = validateDocument({ type: file.type, size: file.size, name: file.name });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // If Cloudinary is configured, upload directly
    if (isDocumentStorageConfigured()) {
      const verificationId = crypto.randomUUID();
      const urls: string[] = [];

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadDocumentToCloudinary(buffer, file.name, user.id, verificationId);
        if (result) {
          urls.push(result.publicId); // Store publicId, not URL
        } else {
          return NextResponse.json({ error: `Failed to upload ${file.name}` }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, mode: "cloudinary", urls, verificationId });
    }

    // Fallback: return placeholder URLs (development mode)
    const urls: string[] = [];
    for (const file of files) {
      const url = `/api/seller-verification/files/${user.id}/${encodeURIComponent(file.name)}`;
      urls.push(url);
    }

    return NextResponse.json({ success: true, mode: "placeholder", urls });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}