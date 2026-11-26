"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";
import { setFavorite } from "@/features/favorites/services/favorite.service";

const setFavoriteSchema = z.object({
  listingId: z.string().trim().min(1).max(128),
  favorite: z.boolean(),
});

export async function setFavoriteAction(input: {
  listingId: string;
  favorite: boolean;
}): Promise<{ ok: true; favorite: boolean } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to save favorites." };

  const parsed = setFavoriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid favorite request." };

  try {
    await setFavorite(user.id, parsed.data.listingId, parsed.data.favorite);
    revalidatePath(ROUTES.favorites);
    revalidatePath(ROUTES.marketplace);
    return { ok: true, favorite: parsed.data.favorite };
  } catch (error) {
    console.error("[favorites] Could not update favorite.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update favorites.",
    };
  }
}
