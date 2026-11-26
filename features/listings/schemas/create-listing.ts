import { z } from "zod";

import {
  MAX_ASSET_BYTES,
  MAX_MODEL_ASSETS,
  MAX_MODEL_BYTES,
  MAX_MODEL_TOTAL_BYTES,
  assetBaseName,
  isCloudinaryAssetUrl,
  isSafeAssetName,
} from "@/lib/model-assets";
import { isValidImageUrl, MAX_IMAGE_URL_LENGTH } from "@/lib/validation/image-url";

export const CONDITION_VALUES = ["NEW", "OPEN_BOX", "USED", "REFURBISHED", "FOR_PARTS"] as const;

/** Accepts both Cloudinary upload results and seller-supplied https image URLs. */
export const uploadedImageSchema = z.object({
  url: z
    .string()
    .max(MAX_IMAGE_URL_LENGTH)
    .refine(isValidImageUrl, "Enter a valid https image URL."),
  publicId: z.string().max(255).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type UploadedImage = z.infer<typeof uploadedImageSchema>;

export const uploadedModelAssetSchema = z.object({
  uri: z
    .string()
    .min(1)
    .max(255)
    .refine((uri) => isSafeAssetName(assetBaseName(uri)), "Invalid model asset name."),
  url: z
    .string()
    .max(MAX_IMAGE_URL_LENGTH)
    .refine(isCloudinaryAssetUrl, "Model assets must use secure Cloudinary URLs."),
  publicId: z.string().min(1).max(255),
  bytes: z.number().int().positive().max(MAX_ASSET_BYTES),
});

export const modelGenerationReceiptSchema = z.object({
  runId: z.string().max(128).optional(),
  vertices: z.number().int().nonnegative().optional(),
  faces: z.number().int().nonnegative().optional(),
  durationMs: z.number().nonnegative().optional(),
});

export const uploadedModelSchema = z
  .object({
    url: z
      .string()
      .max(MAX_IMAGE_URL_LENGTH)
      .refine(isCloudinaryAssetUrl, "Models must use secure Cloudinary URLs."),
    publicId: z.string().min(1).max(255),
    format: z.enum(["GLB", "GLTF"]),
    sizeBytes: z.number().int().positive().max(MAX_MODEL_BYTES),
    assets: z.array(uploadedModelAssetSchema).max(MAX_MODEL_ASSETS),
    sourceType: z.enum(["UPLOADED", "GENERATED"]).optional(),
    processingStatus: z.enum(["GENERATING", "READY", "FAILED"]).optional(),
    sourceImageUrl: z
      .string()
      .max(MAX_IMAGE_URL_LENGTH)
      .refine(isValidImageUrl, "Generated models must cite a valid source image URL.")
      .optional(),
    sourceImagePublicId: z.string().max(255).optional(),
    generator: z.string().max(64).optional(),
    generatorVersion: z.string().max(64).optional(),
    generationReceipt: modelGenerationReceiptSchema.optional(),
  })
  .refine((model) => {
    const total = model.sizeBytes + model.assets.reduce((sum, asset) => sum + asset.bytes, 0);
    return total <= MAX_MODEL_TOTAL_BYTES;
  }, "The 3D model and its assets are too large.")
  .refine((model) => !model.processingStatus || model.processingStatus === "READY", {
    message: "Only completed 3D models can be saved.",
    path: ["processingStatus"],
  })
  .refine(
    (model) =>
      model.sourceType !== "GENERATED" ||
      (Boolean(model.sourceImageUrl) &&
        Boolean(model.generator) &&
        model.format === "GLB" &&
        model.assets.length === 0),
    {
      message: "Generated models require a source photo and a standalone GLB.",
      path: ["sourceType"],
    },
  );

export type UploadedModelAsset = z.infer<typeof uploadedModelAssetSchema>;
export type UploadedModel = z.infer<typeof uploadedModelSchema>;

/**
 * Ordinary photographs only. 36 frames is the upper bound for the honest
 * 360° tier; the seller's upload order is the viewer's rotation order.
 */
export const MAX_LISTING_PHOTOS = 36;

export const createListingSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(120),
  description: z.string().trim().min(20, "Add a bit more detail").max(4000),
  price: z
    .number({ message: "Enter a valid price" })
    .positive("Price must be greater than 0")
    .max(100_000_000),
  condition: z.enum(CONDITION_VALUES, { message: "Select a condition" }),
  categorySlug: z.string().min(1, "Select a category"),
  brandSlug: z.string().optional(),
  countryId: z.string().min(1, "Select a country"),
  cityId: z.string().min(1, "Select a city"),
  areaId: z.string().optional().or(z.literal("")),
  negotiable: z.boolean().optional(),

  // Phone-specific attributes (all optional).
  storage: z.string().trim().max(40).optional(),
  ram: z.string().trim().max(40).optional(),
  color: z.string().trim().max(40).optional(),
  batteryHealth: z
    .string()
    .regex(/^\d{1,3}$/, "Enter a number 0–100")
    .optional()
    .or(z.literal("")),
  ptaApproved: z.boolean().optional(),
  ptaStatus: z.enum(["PTA_APPROVED", "NON_PTA", "CPID", "FACTORY_UNLOCKED", "CARRIER_LOCKED", "UNKNOWN", "VERIFICATION_PENDING"]).optional(),
  cpidStatus: z.enum(["CPID_APPROVED", "NON_CPID", "UNKNOWN"]).optional(),
  
  // Extended phone attributes
  model: z.string().trim().max(100).optional(),
  variant: z.string().trim().max(100).optional(),
  networkType: z.enum(["SINGLE_SIM", "DUAL_SIM", "ESIM", "HYBRID"]).optional(),
  carrier: z.string().trim().max(50).optional(),
  isUnlocked: z.boolean().optional(),
  modelNumber: z.string().trim().max(50).optional(),
  region: z.string().trim().max(50).optional(),
  warranty: z.enum(["NO_WARRANTY", "MANUFACTURER", "SELLER", "THIRD_PARTY"]).optional(),
  warrantyExpiry: z.string().optional(),
  hasOriginalBox: z.boolean().optional(),
  hasCharger: z.boolean().optional(),
  hasHeadphones: z.boolean().optional(),
  repairHistory: z.string().trim().max(500).optional(),

  // Category-specific attributes (tablets, laptops and accessories).
  processor: z.string().trim().max(40).optional(),
  operatingSystem: z.string().trim().max(40).optional(),
  screenSize: z.string().trim().max(20).optional(),
  connectivity: z.string().trim().max(40).optional(),
  accessoryType: z.string().trim().max(40).optional(),
  compatibility: z.string().trim().max(40).optional(),

  images: z
    .array(uploadedImageSchema)
    .min(1, "Add at least one photo")
    .max(MAX_LISTING_PHOTOS)
    .refine((images) => new Set(images.map((image) => image.url)).size === images.length, {
      message: "Duplicate photos are not allowed.",
    }),

  /** Optional genuine 3D model. Sellers are never required to provide one. */
  model3d: uploadedModelSchema.nullable().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
