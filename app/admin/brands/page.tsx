import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getAdminBrands } from "@/features/admin/services/brand.service";
import { BrandManager } from "@/features/admin/components/brand-manager";

export const metadata: Metadata = {
  title: "Admin — Brands",
  robots: { index: false, follow: false },
};

export default async function AdminBrandsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const brands = await getAdminBrands();

  return <BrandManager brands={brands} />;
}

