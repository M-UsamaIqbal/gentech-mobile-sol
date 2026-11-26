"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { logAudit } from "@/features/audit";
import {
  createAdminCountry,
  updateAdminCountry,
  createAdminCity,
  updateAdminCity,
  deleteAdminCity,
  createAdminArea,
  updateAdminArea,
  deleteAdminArea,
} from "../services/location.service";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const createCitySchema = z.object({
  name: z.string().trim().min(2, "City name must be at least 2 characters").max(60),
  countryId: z.string().min(1, "Country is required"),
  slug: z.string().max(80).optional(),
  province: z.string().max(60).optional(),
  popular: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

const createCountrySchema = z.object({
  name: z.string().trim().min(2, "Country name must be at least 2 characters").max(80),
  slug: z.string().max(80).optional(),
  code: z.string().trim().min(2).max(3).regex(/^[a-zA-Z]+$/, "Use a 2–3 letter country code."),
  position: z.number().int().min(0).optional(),
});

export async function createCountryAction(
  input: z.infer<typeof createCountrySchema>,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };
  const parsed = createCountrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid country data." };
  }
  try {
    const country = await createAdminCountry(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "COUNTRY_CREATED",
      resource: "Country",
      resourceId: country.id,
      after: country,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create country." };
  }
}

const updateCountrySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().max(80).optional(),
  code: z.string().trim().min(2).max(3).regex(/^[a-zA-Z]+$/).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function updateCountryAction(
  input: z.infer<typeof updateCountrySchema>,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };
  const parsed = updateCountrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update." };
  }
  try {
    const { id, ...data } = parsed.data;
    const updated = await updateAdminCountry(id, data);
    await logAudit({
      actorId: admin.id,
      action: "COUNTRY_UPDATED",
      resource: "Country",
      resourceId: id,
      after: updated,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update country." };
  }
}

export async function createCityAction(input: z.infer<typeof createCitySchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };

  const parsed = createCitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid city data." };
  }

  try {
    const city = await createAdminCity(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "CITY_CREATED",
      resource: "City",
      resourceId: city.id,
      after: city,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create city." };
  }
}

const updateCitySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(60).optional(),
  slug: z.string().max(80).optional(),
  countryId: z.string().min(1).optional(),
  province: z.string().max(60).nullable().optional(),
  popular: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function updateCityAction(input: z.infer<typeof updateCitySchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };

  const parsed = updateCitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update." };
  }

  try {
    const { id, ...data } = parsed.data;
    const updated = await updateAdminCity(id, data);
    await logAudit({
      actorId: admin.id,
      action: "CITY_UPDATED",
      resource: "City",
      resourceId: id,
      after: updated,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update city." };
  }
}

export async function deleteCityAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid city." };

  try {
    await deleteAdminCity(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "CITY_DELETED",
      resource: "City",
      resourceId: parsed.data,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete city." };
  }
}

const createAreaSchema = z.object({
  name: z.string().trim().min(2, "Area name must be at least 2 characters").max(80),
  cityId: z.string().min(1, "City is required"),
  position: z.number().int().min(0).optional(),
});

const updateAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function updateAreaAction(input: z.infer<typeof updateAreaSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };
  const parsed = updateAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid area update." };
  }
  try {
    const { id, ...data } = parsed.data;
    const updated = await updateAdminArea(id, data);
    await logAudit({
      actorId: admin.id,
      action: "AREA_UPDATED",
      resource: "Area",
      resourceId: id,
      after: updated,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update area." };
  }
}

export async function createAreaAction(input: z.infer<typeof createAreaSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };

  const parsed = createAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid area data." };
  }

  try {
    const area = await createAdminArea(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "AREA_CREATED",
      resource: "Area",
      resourceId: area.id,
      after: area,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create area." };
  }
}

export async function deleteAreaAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized. Admin required." };
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid area." };

  try {
    await deleteAdminArea(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "AREA_DELETED",
      resource: "Area",
      resourceId: parsed.data,
    });
    revalidatePath("/admin/locations");
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete area." };
  }
}
