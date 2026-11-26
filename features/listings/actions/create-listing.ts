"use server";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache";
import { ROUTES } from "@/lib/constants";
import { isOwnedModelPublicId } from "@/lib/model-assets";
import { getCurrentUser } from "@/lib/session";
import { createListingSchema, type CreateListingInput } from "../schemas/create-listing";
import { createListing } from "../services/listing.service";

export interface CreateListingResult {
  ok: boolean;
  id?: string;
  slug?: string;
  error?: string;
}

/** Server action: validate input, enforce auth, persist the listing. */
export async function createListingAction(input: CreateListingInput): Promise<CreateListingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to post a listing." };
  }

  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }

  const model = parsed.data.model3d;
  if (
    model &&
    (!isOwnedModelPublicId(model.publicId, user.id) ||
      model.assets.some((asset) => !isOwnedModelPublicId(asset.publicId, user.id)))
  ) {
    return { ok: false, error: "The selected 3D model does not belong to your account." };
  }

  try {
    const { id, slug } = await createListing(parsed.data, user.id);
    revalidatePath(ROUTES.marketplace);
    revalidatePath(ROUTES.dashboard);
    updateTag(CACHE_TAGS.catalog);
    return { ok: true, id, slug };
  } catch (error) {
    console.error("[create-listing] failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create the listing.",
    };
  }
}
