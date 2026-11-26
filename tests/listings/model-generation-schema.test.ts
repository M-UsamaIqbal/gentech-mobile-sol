import { describe, expect, it } from "vitest";

import { uploadedModelSchema } from "@/features/listings/schemas/create-listing";

const base = {
  url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/sf3d.glb",
  publicId: "models/user_1/sf3d.glb",
  format: "GLB" as const,
  sizeBytes: 8,
  assets: [],
};

const generated = {
  ...base,
  sourceType: "GENERATED" as const,
  processingStatus: "READY" as const,
  sourceImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/listings/user_1/phone.jpg",
  sourceImagePublicId: "listings/user_1/phone.jpg",
  generator: "SF3D_WEBGPU",
  generatorVersion: "kit-1",
  generationReceipt: { runId: "run-1", vertices: 120, faces: 240, durationMs: 1234 },
};

describe("generated 3D model schema", () => {
  it("accepts a generated GLB with complete provenance", () => {
    expect(uploadedModelSchema.safeParse(generated).success).toBe(true);
  });

  it("rejects generated models without a source photo and generator", () => {
    const result = uploadedModelSchema.safeParse({ ...base, sourceType: "GENERATED" });
    expect(result.success).toBe(false);
  });

  it("rejects incomplete processing states", () => {
    const result = uploadedModelSchema.safeParse({
      ...generated,
      processingStatus: "GENERATING",
    });
    expect(result.success).toBe(false);
  });

  it("defaults legacy uploads to seller-supplied provenance when absent", () => {
    const parsed = uploadedModelSchema.parse(base);
    expect(parsed.sourceType).toBeUndefined();
    expect(parsed.processingStatus).toBeUndefined();
  });
});
