"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/cache";

import { requireAdmin } from "@/features/admin/lib/require-admin";
import { logAudit } from "@/features/audit";
import {
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
} from "@/features/admin/services/brand.service";
import {
  createAdminModel,
  updateAdminModel,
  deleteAdminModel,
} from "@/features/admin/services/model.service";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const createBrandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(60),
  slug: z.string().max(80).optional(),
  logo: z.string().url("Logo must be a valid URL").optional().or(z.literal("")),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function createBrandAction(input: z.infer<typeof createBrandSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = createBrandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid brand data." };
  }

  try {
    const brand = await createAdminBrand({
      ...parsed.data,
      logo: parsed.data.logo || undefined,
    });

    await logAudit({
      actorId: admin.id,
      action: "BRAND_CREATED",
      resource: "Brand",
      resourceId: brand.id,
      after: { name: brand.name, slug: brand.slug },
    });

    revalidatePath("/admin/brands");
    revalidatePath("/marketplace");
    revalidatePath("/sell");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create brand.";
    return { ok: false, error: message };
  }
}

const updateBrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(60).optional(),
  slug: z.string().max(80).optional(),
  logo: z.string().url().optional().or(z.literal("")).nullable(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function updateBrandAction(input: z.infer<typeof updateBrandSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = updateBrandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid brand data." };
  }

  try {
    const { id, ...data } = parsed.data;
    const brand = await updateAdminBrand(id, {
      ...data,
      logo: data.logo === "" ? null : data.logo,
    });

    await logAudit({
      actorId: admin.id,
      action: "BRAND_UPDATED",
      resource: "Brand",
      resourceId: brand.id,
      after: { name: brand.name, isActive: brand.isActive },
    });

    revalidatePath("/admin/brands");
    revalidatePath("/marketplace");
    revalidatePath("/sell");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update brand.";
    return { ok: false, error: message };
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  try {
    await deleteAdminBrand(id);

    await logAudit({
      actorId: admin.id,
      action: "BRAND_DELETED",
      resource: "Brand",
      resourceId: id,
    });

    revalidatePath("/admin/brands");
    revalidatePath("/marketplace");
    revalidatePath("/sell");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete brand.";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Phone Models
// ---------------------------------------------------------------------------

const createModelSchema = z.object({
  name: z.string().min(2, "Model name must be at least 2 characters").max(80),
  slug: z.string().max(100).optional(),
  brandId: z.string().min(1, "Please select a brand"),
  modelNumber: z.string().max(40).optional(),
  releaseDate: z.string().optional(),
  launchPrice: z.number().positive().optional(),
  displaySize: z.string().max(40).optional(),
  displayResolution: z.string().max(40).optional(),
  displayType: z.string().max(40).optional(),
  refreshRate: z.string().max(20).optional(),
  processor: z.string().max(60).optional(),
  cpuCores: z.number().int().min(1).max(32).optional(),
  gpu: z.string().max(60).optional(),
  ramOptions: z.array(z.string()).optional(),
  storageOptions: z.array(z.string()).optional(),
  mainCamera: z.string().max(100).optional(),
  selfieCamera: z.string().max(100).optional(),
  batteryCapacity: z.string().max(40).optional(),
  chargingSpeed: z.string().max(40).optional(),
  networkSupport: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isUpcoming: z.boolean().optional(),
});

export async function createModelAction(input: z.infer<typeof createModelSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = createModelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid model data." };
  }

  try {
    const model = await createAdminModel({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || undefined,
    });

    await logAudit({
      actorId: admin.id,
      action: "PHONE_MODEL_CREATED",
      resource: "PhoneModel",
      resourceId: model.id,
      after: { name: model.name, brandId: model.brandId },
    });

    revalidatePath("/admin/models");
    revalidatePath("/compare");
    revalidatePath("/valuation");
    revalidatePath("/marketplace");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create model.";
    return { ok: false, error: message };
  }
}

const updateModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  slug: z.string().max(100).optional(),
  brandId: z.string().min(1).optional(),
  modelNumber: z.string().max(40).optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  launchPrice: z.number().positive().optional().nullable(),
  displaySize: z.string().max(40).optional().nullable(),
  displayResolution: z.string().max(40).optional().nullable(),
  displayType: z.string().max(40).optional().nullable(),
  refreshRate: z.string().max(20).optional().nullable(),
  processor: z.string().max(60).optional().nullable(),
  cpuCores: z.number().int().min(1).max(32).optional().nullable(),
  gpu: z.string().max(60).optional().nullable(),
  ramOptions: z.array(z.string()).optional(),
  storageOptions: z.array(z.string()).optional(),
  mainCamera: z.string().max(100).optional().nullable(),
  selfieCamera: z.string().max(100).optional().nullable(),
  cameraFeatures: z.array(z.string()).optional(),
  batteryCapacity: z.string().max(40).optional().nullable(),
  batteryType: z.string().max(40).optional().nullable(),
  chargingSpeed: z.string().max(40).optional().nullable(),
  networkSupport: z.array(z.string()).optional(),
  simType: z.string().max(40).optional().nullable(),
  wifi: z.string().max(40).optional().nullable(),
  bluetooth: z.string().max(40).optional().nullable(),
  nfc: z.boolean().optional().nullable(),
  weight: z.string().max(40).optional().nullable(),
  dimensions: z.string().max(60).optional().nullable(),
  os: z.string().max(40).optional().nullable(),
  osVersion: z.string().max(40).optional().nullable(),
  features: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  description: z.string().max(1000).optional().nullable(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isUpcoming: z.boolean().optional(),
});

export async function updateModelAction(input: z.infer<typeof updateModelSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = updateModelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid model data." };
  }

  try {
    const { id, ...data } = parsed.data;
    const model = await updateAdminModel(id, {
      ...data,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    });

    await logAudit({
      actorId: admin.id,
      action: "PHONE_MODEL_UPDATED",
      resource: "PhoneModel",
      resourceId: model.id,
      after: { name: model.name, isActive: model.isActive },
    });

    revalidatePath("/admin/models");
    revalidatePath("/compare");
    revalidatePath("/valuation");
    revalidatePath("/marketplace");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update model.";
    return { ok: false, error: message };
  }
}

export async function deleteModelAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  try {
    await deleteAdminModel(id);

    await logAudit({
      actorId: admin.id,
      action: "PHONE_MODEL_DELETED",
      resource: "PhoneModel",
      resourceId: id,
    });

    revalidatePath("/admin/models");
    revalidatePath("/compare");
    revalidatePath("/valuation");
    revalidatePath("/marketplace");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete model.";
    return { ok: false, error: message };
  }
}

