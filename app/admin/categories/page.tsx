import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import {
  getCategories,
  getCategoryOptions,
} from "@/features/admin/services/admin.service";
import { CategoryManager } from "@/features/admin/components/category-manager";

export const metadata: Metadata = { 
  title: "Admin — Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const [categories, parentOptions] = await Promise.all([
    getCategories(),
    getCategoryOptions(),
  ]);

  return <CategoryManager categories={categories} parentOptions={parentOptions} />;
}
