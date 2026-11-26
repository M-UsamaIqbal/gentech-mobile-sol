import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getAdminLocations } from "@/features/admin/services/location.service";
import { LocationManager } from "@/features/admin/components/location-manager";

export const metadata: Metadata = {
  title: "Admin — Location Taxonomy",
  robots: { index: false, follow: false },
};

export default async function AdminLocationsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const countries = await getAdminLocations();

  return <LocationManager countries={countries} />;
}
