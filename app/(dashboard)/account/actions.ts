"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRequestCountryLocale } from "@/lib/countries/server";
import { validatePhoneForCountry } from "@/lib/validation/phone";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  bio: z.string().max(300).optional(),
  phone: z.string().trim().max(24).optional(),
  city: z.string().max(80).optional(),
});

type ActionResult = { ok: boolean; error?: string };

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to update your profile." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { country } = await getRequestCountryLocale();
  const phoneError = validatePhoneForCountry(parsed.data.phone, country);
  if (phoneError) return { ok: false, error: phoneError };

  const { name, bio, phone, city } = parsed.data;

  try {
    await Promise.all([
      prisma.user.update({ where: { id: user.id }, data: { name } }),
      prisma.profile.upsert({
        where: { userId: user.id },
        update: { bio: bio ?? null, phone: phone ?? null, city: city ?? null },
        create: { userId: user.id, bio: bio ?? null, phone: phone ?? null, city: city ?? null },
      }),
    ]);

    revalidatePath(ROUTES.account);
    return { ok: true };
  } catch (error) {
    console.error("[account] updateProfile failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
