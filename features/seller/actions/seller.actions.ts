"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/cache";
import { LISTING_STATUSES, ROUTES } from "@/lib/constants";
import { isOwnedModelPublicId } from "@/lib/model-assets";
import { getCurrentUser } from "@/lib/session";
import {
  uploadedModelSchema,
  type UploadedModel,
} from "@/features/listings/schemas/create-listing";
import {
  changeListingStatus,
  removeListing,
  saveListingModel,
} from "@/features/seller/services/seller.service";

const listingIdSchema = z.object({ listingId: z.string().min(1) });
const modelInputSchema = z.object({
  listingId: z.string().min(1),
  model: uploadedModelSchema.nullable(),
});

type ActionResult = { ok: boolean; error?: string };

const SIGN_IN_REQUIRED = "Sign in to manage your listings.";
const NOT_FOUND = "Listing not found.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function revalidateSellerSurfaces() {
  revalidatePath(ROUTES.myListings);
  revalidatePath(ROUTES.dashboard);
  updateTag(CACHE_TAGS.catalog);
}

/** Marks one of the current seller's listings as SOLD. */
export async function markListingSoldAction(input: {
  listingId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = listingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  try {
    const ok = await changeListingStatus(user.id, parsed.data.listingId, LISTING_STATUSES.SOLD);
    if (!ok) return { ok: false, error: NOT_FOUND };
    revalidateSellerSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[seller] markSold failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Re-activates one of the current seller's listings (e.g. relist after sold). */
export async function markListingActiveAction(input: {
  listingId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = listingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  try {
    const ok = await changeListingStatus(user.id, parsed.data.listingId, LISTING_STATUSES.ACTIVE);
    if (!ok) return { ok: false, error: NOT_FOUND };
    revalidateSellerSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[seller] markActive failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Soft-deletes one of the current seller's listings. */
export async function deleteListingAction(input: {
  listingId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = listingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  try {
    const ok = await removeListing(user.id, parsed.data.listingId);
    if (!ok) return { ok: false, error: NOT_FOUND };
    revalidateSellerSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[seller] deleteListing failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Adds or replaces the optional 3D model on one of the seller's own listings. */
export async function saveListingModelAction(input: {
  listingId: string;
  model: UploadedModel | null;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = modelInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "The 3D model details are invalid." };
  }

  const { model } = parsed.data;
  if (
    model &&
    (!isOwnedModelPublicId(model.publicId, user.id) ||
      model.assets.some((asset) => !isOwnedModelPublicId(asset.publicId, user.id)))
  ) {
    return { ok: false, error: "The selected 3D model does not belong to your account." };
  }

  try {
    const ok = await saveListingModel(user.id, parsed.data.listingId, model);
    if (!ok) return { ok: false, error: NOT_FOUND };
    revalidateSellerSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[seller] saveListingModel failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Removes the optional 3D model from one of the seller's own listings. */
export async function removeListingModelAction(input: {
  listingId: string;
}): Promise<ActionResult> {
  return saveListingModelAction({ listingId: input.listingId, model: null });
}
