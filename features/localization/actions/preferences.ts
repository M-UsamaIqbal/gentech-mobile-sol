"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import type { CountryCode, LocaleCode } from "@/lib/countries/types";
import {
  COUNTRY_COOKIE,
  LOCALE_COOKIE,
  PREFERENCE_COOKIE_MAX_AGE,
  USER_COUNTRY_COOKIE,
  USER_LOCALE_COOKIE,
} from "@/lib/localization/detect";
import { getCurrentUser } from "@/lib/session";
import { saveUserLocalizationPreferences } from "@/features/localization/repositories/user-preferences.repository";

const preferenceSchema = z.object({
  country: z.enum(["BH", "PK"]),
  locale: z.enum(["en", "ar", "ur"]),
});

export interface SaveLocalizationPreferencesResult {
  ok: boolean;
  persistedToProfile: boolean;
  error?: string;
}

/**
 * Persists an independent country or language selection. Cookies are the
 * immediate, Edge-readable source of truth; the authenticated profile is the
 * durable store and is mirrored into user-scoped cookies for detection.
 */
export async function saveLocalizationPreferencesAction(input: {
  country: CountryCode;
  locale: LocaleCode;
}): Promise<SaveLocalizationPreferencesResult> {
  const parsed = preferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, persistedToProfile: false, error: "Unsupported country or language." };
  }

  const { country, locale } = parsed.data;
  const cookieStore = await cookies();
  const options = {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // Only the changed preference is logically updated by the caller; writing the
  // resolved pair keeps both cookies consistent without changing the other one.
  cookieStore.set(COUNTRY_COOKIE, country, options);
  cookieStore.set(LOCALE_COOKIE, locale, options);

  const user = await getCurrentUser();
  if (!user) {
    return { ok: true, persistedToProfile: false };
  }

  // Mirror the new choice for Edge detection regardless of DB availability.
  // Leaving a stale user cookie in place would override the freshly written
  // preference cookies on the next request.
  cookieStore.set(USER_COUNTRY_COOKIE, country, options);
  cookieStore.set(USER_LOCALE_COOKIE, locale, options);

  const persistedToProfile = await saveUserLocalizationPreferences(user.id, country, locale);

  return { ok: true, persistedToProfile };
}
