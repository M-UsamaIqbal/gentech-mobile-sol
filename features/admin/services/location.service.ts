import "server-only";

import { slugify } from "@/utils/slug";
import {
  getAllCountriesForAdmin,
  createCountry as repoCreateCountry,
  getCountryById,
  updateCountry as repoUpdateCountry,
  getCityById,
  createCity as repoCreateCity,
  updateCity as repoUpdateCity,
  deleteCity as repoDeleteCity,
  createArea as repoCreateArea,
  deleteArea as repoDeleteArea,
  updateArea as repoUpdateArea,
  type CountryWithCities,
} from "../repositories/location.repository";

export async function getAdminLocations(): Promise<CountryWithCities[]> {
  return getAllCountriesForAdmin();
}

export async function createAdminCountry(data: {
  name: string;
  slug?: string;
  code: string;
  position?: number;
}) {
  return repoCreateCountry({
    name: data.name.trim(),
    slug: slugify(data.slug?.trim() || data.name),
    code: data.code.trim().toUpperCase(),
    position: data.position ?? 0,
  });
}

export async function updateAdminCountry(
  id: string,
  data: { name?: string; slug?: string; code?: string; position?: number; isActive?: boolean },
) {
  const updates: Parameters<typeof repoUpdateCountry>[1] = {};
  if (data.name !== undefined) {
    updates.name = data.name.trim();
    updates.slug = slugify(data.slug ?? data.name);
  } else if (data.slug !== undefined) {
    updates.slug = slugify(data.slug);
  }
  if (data.code !== undefined) updates.code = data.code.trim().toUpperCase();
  if (data.position !== undefined) updates.position = data.position;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  return repoUpdateCountry(id, updates);
}

export async function createAdminCity(data: {
  name: string;
  slug?: string;
  countryId: string;
  province?: string;
  popular?: boolean;
  position?: number;
  isActive?: boolean;
}) {
  const country = await getCountryById(data.countryId);
  if (!country?.isActive) {
    throw new Error("Choose an active country.");
  }
  const baseSlug = slugify(data.slug && data.slug.trim().length > 0 ? data.slug : data.name);
  return repoCreateCity({
    name: data.name.trim(),
    slug: baseSlug,
    countryId: data.countryId,
    province: data.province?.trim() || undefined,
    popular: data.popular ?? false,
    position: data.position ?? 0,
    isActive: data.isActive ?? true,
  });
}

export async function updateAdminCity(
  id: string,
  data: {
    name?: string;
    slug?: string;
    countryId?: string;
    province?: string | null;
    popular?: boolean;
    position?: number;
    isActive?: boolean;
  },
) {
  const existing = await getCityById(id);
  if (!existing) {
    throw new Error("City not found");
  }
  if (data.countryId) {
    const country = await getCountryById(data.countryId);
    if (!country?.isActive) throw new Error("Choose an active country.");
  }

  const updates: Parameters<typeof repoUpdateCity>[1] = {};
  if (data.name !== undefined) {
    updates.name = data.name.trim();
    updates.slug = slugify(data.slug ?? data.name);
  } else if (data.slug !== undefined) {
    updates.slug = slugify(data.slug);
  }
  if (data.countryId !== undefined) updates.countryId = data.countryId;
  if (data.province !== undefined) updates.province = data.province?.trim() || null;
  if (data.popular !== undefined) updates.popular = data.popular;
  if (data.position !== undefined) updates.position = data.position;
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  return repoUpdateCity(id, updates);
}

export async function deleteAdminCity(id: string) {
  const existing = await getCityById(id);
  if (!existing) {
    throw new Error("City not found");
  }
  return repoDeleteCity(id);
}

export async function createAdminArea(data: {
  name: string;
  slug?: string;
  cityId: string;
  position?: number;
  isActive?: boolean;
}) {
  const baseSlug = slugify(data.slug && data.slug.trim().length > 0 ? data.slug : data.name);
  return repoCreateArea({
    name: data.name.trim(),
    slug: baseSlug,
    cityId: data.cityId,
    position: data.position ?? 0,
    isActive: data.isActive ?? true,
  });
}

export async function deleteAdminArea(id: string) {
  return repoDeleteArea(id);
}

export async function updateAdminArea(
  id: string,
  data: { name?: string; position?: number; isActive?: boolean },
) {
  const updates: Parameters<typeof repoUpdateArea>[1] = {};
  if (data.name !== undefined) {
    updates.name = data.name.trim();
    updates.slug = slugify(data.name);
  }
  if (data.position !== undefined) updates.position = data.position;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  return repoUpdateArea(id, updates);
}
