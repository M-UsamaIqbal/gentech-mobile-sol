import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mirror of the Cloudinary sign route's allowlist. */
const ALLOWED_FOLDERS = ["listings", "messages", "inspections", "quotes"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

function parseFolder(value: FormDataEntryValue | null): UploadFolder {
  return ALLOWED_FOLDERS.includes(value as UploadFolder) ? (value as UploadFolder) : "quotes";
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * DEV-ONLY image upload. Lets the whole quote flow work with no Cloudinary account:
 * writes the file under `public/uploads/<folder>/` and returns a Cloudinary-shaped
 * response. Disabled in production and whenever Cloudinary IS configured — in those
 * cases the real signed-upload path (api/v1/uploads/sign) is used instead.
 */
export async function POST(request: NextRequest) {
  if (env.NODE_ENV === "production" || isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is over 8 MB." }, { status: 413 });
  }

  const folder = parseFolder(form?.get("folder") ?? null);
  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const id = crypto.randomUUID();
  const dir = path.join(process.cwd(), "public", "uploads", folder);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error("[uploads/local] write failed:", error);
    return NextResponse.json({ error: "Could not save the file." }, { status: 500 });
  }

  // Root-relative path: next/image serves it as a same-origin local image (no host
  // config, works on any dev port). The schemas accept local paths as well as URLs.
  return NextResponse.json({
    secure_url: `/uploads/${folder}/${id}.${ext}`,
    public_id: `${folder}/${id}`,
  });
}
