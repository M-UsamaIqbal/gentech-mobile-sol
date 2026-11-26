import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { reviewVerification } from "@/features/seller-verification/services/seller-verification.service";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await reviewVerification(id, status, admin.id, notes);

    if (!result) {
      return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
  }
}