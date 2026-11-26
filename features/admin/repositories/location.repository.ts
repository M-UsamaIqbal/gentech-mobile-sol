import "server-only";

import { prisma } from "@/lib/prisma";
import type { Country, City, Area } from "@/lib/generated/prisma/client";

export interface CityWithAreas extends City {
  areas: Area[];
  _count: {
    areas: number;
  };
}

export interface CountryWithCities extends Country {
  cities: CityWithAreas[];
}

export async function getAllCountriesForAdmin(): Promise<CountryWithCities[]> {
  return prisma.country.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      cities: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          areas: { orderBy: [{ position: "asc" }, { name: "asc" }] },
          _count: { select: { areas: true } },
        },
      },
    },
  });
}

export async function createCountry(data: {
  name: string;
  slug: string;
  code: string;
  position?: number;
  isActive?: boolean;
}): Promise<Country> {
  return prisma.country.create({
    data: {
      name: data.name,
      slug: data.slug,
      code: data.code,
      position: data.position ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getCountryById(id: string): Promise<Country | null> {
  return prisma.country.findUnique({ where: { id } });
}

export async function updateCountry(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    code: string;
    position: number;
    isActive: boolean;
  }>,
): Promise<Country> {
  return prisma.country.update({ where: { id }, data });
}

export async function createCity(data: {
  name: string;
  slug: string;
  countryId: string;
  province?: string;
  popular?: boolean;
  position?: number;
  isActive?: boolean;
}): Promise<City> {
  return prisma.city.create({
    data: {
      name: data.name,
      slug: data.slug,
      countryId: data.countryId,
      province: data.province ?? null,
      popular: data.popular ?? false,
      position: data.position ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getCityById(id: string): Promise<City | null> {
  return prisma.city.findUnique({
    where: { id },
    include: { areas: true },
  });
}

export async function updateCity(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    countryId: string;
    province: string | null;
    popular: boolean;
    position: number;
    isActive: boolean;
  }>,
): Promise<City> {
  return prisma.city.update({
    where: { id },
    data,
  });
}

export async function deleteCity(id: string): Promise<City> {
  return prisma.city.delete({
    where: { id },
  });
}

export async function createArea(data: {
  name: string;
  slug: string;
  cityId: string;
  position?: number;
  isActive?: boolean;
}): Promise<Area> {
  return prisma.area.create({
    data: {
      name: data.name,
      slug: data.slug,
      cityId: data.cityId,
      position: data.position ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function deleteArea(id: string): Promise<Area> {
  return prisma.area.delete({
    where: { id },
  });
}

export async function updateArea(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    position: number;
    isActive: boolean;
  }>,
): Promise<Area> {
  return prisma.area.update({ where: { id }, data });
}
