import "server-only";

import { prisma } from "@/lib/prisma";
import type { CountryCode, LocaleCode } from "@/lib/countries/types";
import { normalizeCountry, normalizeLocale } from "@/lib/localization/detect";

export interface StoredLocalizationPreferences {
  country: CountryCode | null;
  locale: LocaleCode | null;
  /** Existing region field, used only as a fallback saved-country signal. */
  regionCountry: CountryCode | null;
}

/**
 * Reads the authenticated user's saved localization preferences.
 * Returns null when no user exists or when the preference columns are not yet
 * available in the deployed database (migration pending) — never throws.
 */
export async function getUserLocalizationPreferences(
  userId: string,
): Promise<StoredLocalizationPreferences | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true, preferredCountry: true, region: true },
    });
    if (!user) return null;

    return {
      locale: normalizeLocale(user.preferredLocale),
      country: normalizeCountry(user.preferredCountry),
      regionCountry: user.region === "BAHRAIN" ? "BH" : "PK",
    };
  } catch (error) {
    console.warn(
      "[localization] user preference read failed (migration pending?):",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Persists independent preferences. Returns false when the DB cannot accept them. */
export async function saveUserLocalizationPreferences(
  userId: string,
  country: CountryCode,
  locale: LocaleCode,
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { preferredCountry: country, preferredLocale: locale },
      select: { id: true },
    });
    return true;
  } catch (error) {
    console.warn(
      "[localization] user preference save failed (migration pending?):",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
