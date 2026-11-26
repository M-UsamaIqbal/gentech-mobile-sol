import "server-only";

import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function configureCloudinary(): boolean {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/** Deletes a raw model or supporting asset after its database reference is removed. */
export async function deleteRawUpload(publicId: string): Promise<boolean> {
  if (!configureCloudinary() || !publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("[cloudinary] Raw asset deletion failed:", error);
    return false;
  }
}

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  allowedFormats: string[];
}

/**
 * Allowed image formats for upload security.
 */
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;

/**
 * Produces a short-lived signature for a direct (browser → Cloudinary) upload.
 * The API secret never leaves the server; the client uploads using the returned
 * `signature` + `apiKey` + `timestamp`.
 */
export interface SignedRawUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: "raw";
}

/**
 * Short-lived signature for genuine GLB/GLTF files and their supporting assets.
 * Raw uploads keep the original bytes; no image transform is ever applied to a
 * model and no paid service is involved.
 */
export function createRawUploadSignature(folder = "models"): SignedRawUpload {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
    resource_type: "raw",
  };
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    resourceType: "raw",
    signature: crypto
      .createHash("sha1")
      .update(toSign + env.CLOUDINARY_API_SECRET)
      .digest("hex"),
  };
}

export function createUploadSignature(folder = "listings"): SignedUpload {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Sign the alphabetically-sorted params (excluding file, api_key, cloud_name).
  const paramsToSign: Record<string, string | number> = { 
    folder, 
    timestamp,
    allowed_formats: ALLOWED_FORMATS.join(","),
    resource_type: "image",
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
    folder,
    signature,
    allowedFormats: [...ALLOWED_FORMATS],
  };
}
