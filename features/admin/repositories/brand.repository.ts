import "server-only";

import { prisma } from "@/lib/prisma";
import type { Brand } from "@/lib/generated/prisma/client";

export interface AdminBrandItem extends Brand {
  _count: {
    listings: number;
    phoneModels: number;
  };
}

export async function getAllBrandsForAdmin(): Promise<AdminBrandItem[]> {
  return prisma.brand.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          listings: true,
          phoneModels: true,
        },
      },
    },
  });
}

export async function getBrandById(id: string): Promise<Brand | null> {
  return prisma.brand.findUnique({
    where: { id },
  });
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return prisma.brand.findUnique({
    where: { slug },
  });
}

export async function createBrand(data: {
  name: string;
  slug: string;
  logo?: string;
  position?: number;
  isActive?: boolean;
}): Promise<Brand> {
  return prisma.brand.create({
    data: {
      name: data.name,
      slug: data.slug,
      logo: data.logo ?? null,
      position: data.position ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateBrand(
  id: string,
  data: {
    name?: string;
    slug?: string;
    logo?: string | null;
    position?: number;
    isActive?: boolean;
  },
): Promise<Brand> {
  return prisma.brand.update({
    where: { id },
    data,
  });
}

export async function deleteBrand(id: string): Promise<Brand> {
  return prisma.brand.delete({
    where: { id },
  });
}

