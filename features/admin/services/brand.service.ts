import "server-only";

import { slugify } from "@/utils/slug";
import {
  getAllBrandsForAdmin,
  createBrand as repoCreateBrand,
  updateBrand as repoUpdateBrand,
  deleteBrand as repoDeleteBrand,
  getBrandById,
  type AdminBrandItem,
} from "@/features/admin/repositories/brand.repository";

export async function getAdminBrands(): Promise<AdminBrandItem[]> {
  return getAllBrandsForAdmin();
}

export async function createAdminBrand(data: {
  name: string;
  slug?: string;
  logo?: string;
  position?: number;
  isActive?: boolean;
}) {
  const baseSlug = slugify(data.slug && data.slug.trim().length > 0 ? data.slug : data.name);
  return repoCreateBrand({
    name: data.name.trim(),
    slug: baseSlug,
    logo: data.logo?.trim() || undefined,
    position: data.position ?? 0,
    isActive: data.isActive ?? true,
  });
}

export async function updateAdminBrand(
  id: string,
  data: {
    name?: string;
    slug?: string;
    logo?: string | null;
    position?: number;
    isActive?: boolean;
  },
) {
  const existing = await getBrandById(id);
  if (!existing) {
    throw new Error("Brand not found");
  }

  const updates: Parameters<typeof repoUpdateBrand>[1] = {};
  if (data.name !== undefined) {
    updates.name = data.name.trim();
  }
  if (data.slug !== undefined) {
    updates.slug = slugify(data.slug);
  }
  if (data.logo !== undefined) {
    updates.logo = data.logo;
  }
  if (data.position !== undefined) {
    updates.position = data.position;
  }
  if (data.isActive !== undefined) {
    updates.isActive = data.isActive;
  }

  return repoUpdateBrand(id, updates);
}

export async function deleteAdminBrand(id: string) {
  const existing = await getBrandById(id);
  if (!existing) {
    throw new Error("Brand not found");
  }
  return repoDeleteBrand(id);
}

