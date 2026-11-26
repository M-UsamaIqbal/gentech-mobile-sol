import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getAdminModels } from "@/features/admin/services/model.service";
import { getAdminBrands } from "@/features/admin/services/brand.service";
import { ModelManager } from "@/features/admin/components/model-manager";

export const metadata: Metadata = {
  title: "Admin — Phone Models & Specs",
  robots: { index: false, follow: false },
};

export default async function AdminModelsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const [models, brands] = await Promise.all([
    getAdminModels(),
    getAdminBrands(),
  ]);

  return <ModelManager models={models} brands={brands} />;
}

