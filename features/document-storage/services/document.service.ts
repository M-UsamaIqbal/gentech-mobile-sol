import "server-only";

import crypto from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/lib/env";

export interface SecureUploadResult {
  url: string;
  publicId: string;
  signature: string;
  timestamp: number;
}

/**
 * Check if Cloudinary is configured for private document storage.
 */
export function isDocumentStorageConfigured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/**
 * Configure Cloudinary SDK.
 */
function configureCloudinary() {
  if (!isDocumentStorageConfigured()) return false;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/**
 * Upload a document to Cloudinary private storage.
 * Returns the secure URL and public ID.
 */
export async function uploadDocumentToCloudinary(
  file: Buffer,
  fileName: string,
  sellerId: string,
  verificationId: string,
): Promise<{ url: string; publicId: string } | null> {
  if (!configureCloudinary()) return null;

  try {
    const folder = `verification/${sellerId}/${verificationId}`;
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          access_mode: "authenticated",
          public_id: fileName.replace(/\.[^/.]+$/, ""),
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error("Cloudinary upload returned no result"));
        },
      );
      stream.end(file);
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error("[document-storage] Upload failed:", error);
    return null;
  }
}

/**
 * Generate a signed URL for private document access.
 * Short-lived (1 hour).
 */
export function getSignedDocumentUrl(publicId: string): string | null {
  if (!configureCloudinary()) return null;

  try {
    return cloudinary.url(publicId, {
      resource_type: "raw",
      type: "authenticated",
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });
  } catch (error) {
    console.error("[document-storage] Signed URL generation failed:", error);
    return null;
  }
}

/**
 * Allowed document types for seller verification.
 */
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Maximum file size: 5MB.
 */
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

/**
 * Maximum files per submission: 5.
 */
export const MAX_DOCUMENT_COUNT = 5;

/**
 * Generate a signed upload URL for private document storage.
 * Documents are stored in a private folder with restricted access.
 */
export function createPrivateDocumentSignature(
  sellerId: string,
  verificationId: string,
): { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string } | null {
  if (!isDocumentStorageConfigured()) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `verification/${sellerId}/${verificationId}`;

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
    access_mode: "authenticated", // Private access
    resource_type: "raw", // For PDFs and documents
  };

  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(toSign + env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
  };
}

/**
 * Validate a document file.
 */
export function validateDocument(file: { type: string; size: number; name: string }): {
  valid: boolean;
  error?: string;
} {
  if (!new Set<string>(ALLOWED_DOCUMENT_TYPES).has(file.type)) {
    return { valid: false, error: `${file.name}: Invalid file type (PDF, JPEG, PNG, WebP only)` };
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: `${file.name}: File too large (max 5MB)` };
  }
  return { valid: true };
}

/**
 * Validate document count.
 */
export function validateDocumentCount(count: number): { valid: boolean; error?: string } {
  if (count > MAX_DOCUMENT_COUNT) {
    return { valid: false, error: `Maximum ${MAX_DOCUMENT_COUNT} files allowed` };
  }
  if (count === 0) {
    return { valid: false, error: "At least one document is required" };
  }
  return { valid: true };
}