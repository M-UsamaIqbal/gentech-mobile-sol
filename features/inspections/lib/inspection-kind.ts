import { getCategoryFilterProfile } from "@/lib/catalog/category-filters";
import { INSPECTION_KINDS, type InspectionKind } from "@/lib/constants";

/**
 * Maps a listing category to the inspection checklist that applies to it.
 * Laptop and mixed laptop/tablet categories use the laptop checklist; every
 * other category (including phones and tablets with IMEI/PTA) uses the phone
 * checklist. Unknown categories default to phone to preserve legacy behaviour.
 */
export function inspectionKindForCategory(categorySlug?: string | null): InspectionKind {
  if (!categorySlug) return INSPECTION_KINDS.PHONE;

  if (categorySlug === "laptops-tablets" || getCategoryFilterProfile(categorySlug).kind === "laptops") {
    return INSPECTION_KINDS.LAPTOP;
  }

  return INSPECTION_KINDS.PHONE;
}

/**
 * Resolves a request's stored family, falling back to its listing category for
 * rows created before `inspectionKind` existed. Stored values always win.
 */
export function resolveInspectionKind(
  storedKind?: string | null,
  categorySlug?: string | null,
): InspectionKind {
  if (storedKind === INSPECTION_KINDS.LAPTOP) return INSPECTION_KINDS.LAPTOP;
  if (storedKind === INSPECTION_KINDS.PHONE) return INSPECTION_KINDS.PHONE;
  return inspectionKindForCategory(categorySlug);
}
