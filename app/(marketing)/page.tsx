import { redirect } from "next/navigation";

import { getRequestCountryLocale } from "@/lib/countries/server";

/** Middleware normally handles this; keep a server-side fallback with a single destination. */
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const { country, locale } = await getRequestCountryLocale();
  redirect(`/${country.toLowerCase()}/${locale}`);
}
