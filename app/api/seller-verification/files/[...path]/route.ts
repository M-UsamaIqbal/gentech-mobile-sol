import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getSignedDocumentUrl } from "@/features/document-storage/services/document.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params;
    const publicId = path.join("/");

    // Only allow access to own documents or admin
    const isOwner = publicId.includes(user.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signedUrl = getSignedDocumentUrl(publicId);
    if (!signedUrl) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return NextResponse.json({ error: "Failed to access document" }, { status: 500 });
  }
}