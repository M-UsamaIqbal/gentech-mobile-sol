import "server-only";

import { prisma } from "@/lib/prisma";
import type { Region } from "@/lib/generated/prisma/enums";
import type { CountryCode } from "@/lib/countries/types";

export interface ShippingMethodDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  estimatedDays: number;
  isActive: boolean;
}

export interface DeliveryZoneDto {
  id: string;
  name: string;
  city: string | null;
  surcharge: number;
  codAvailable: boolean;
  isActive: boolean;
}

export interface ShippingCalculation {
  method: ShippingMethodDto;
  zone: DeliveryZoneDto | null;
  basePrice: number;
  surcharge: number;
  total: number;
  currency: string;
  estimatedDays: number;
  codAvailable: boolean;
}

/**
 * Get available shipping methods for a country.
 */
export async function getShippingMethods(country: CountryCode): Promise<ShippingMethodDto[]> {
  const region: Region = country === "BH" ? "BAHRAIN" : "PAKISTAN";
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { region, isActive: true },
      orderBy: { position: "asc" },
    });
    return methods.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: Number(m.price),
      currency: m.currency,
      estimatedDays: m.estimatedDays,
      isActive: m.isActive,
    }));
  } catch {
    return [];
  }
}

/**
 * Get delivery zones for a country.
 */
export async function getDeliveryZones(country: CountryCode): Promise<DeliveryZoneDto[]> {
  const region: Region = country === "BH" ? "BAHRAIN" : "PAKISTAN";
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { region, isActive: true },
      orderBy: { name: "asc" },
    });
    return zones.map((z) => ({
      id: z.id,
      name: z.name,
      city: z.city,
      surcharge: Number(z.surcharge),
      codAvailable: z.codAvailable,
      isActive: z.isActive,
    }));
  } catch {
    return [];
  }
}

/**
 * Calculate shipping cost for a country and delivery zone.
 */
export async function calculateShipping(
  country: CountryCode,
  methodId: string,
  zoneId?: string,
): Promise<ShippingCalculation | null> {
  const region: Region = country === "BH" ? "BAHRAIN" : "PAKISTAN";
  try {
    const method = await prisma.shippingMethod.findUnique({
      where: { id: methodId },
    });
    if (!method || method.region !== region || !method.isActive) return null;

    let zone: DeliveryZoneDto | null = null;
    let surcharge = 0;
    let codAvailable = true;

    if (zoneId) {
      const zoneRecord = await prisma.deliveryZone.findUnique({
        where: { id: zoneId },
      });
      if (zoneRecord && zoneRecord.region === region && zoneRecord.isActive) {
        zone = {
          id: zoneRecord.id,
          name: zoneRecord.name,
          city: zoneRecord.city,
          surcharge: Number(zoneRecord.surcharge),
          codAvailable: zoneRecord.codAvailable,
          isActive: zoneRecord.isActive,
        };
        surcharge = Number(zoneRecord.surcharge);
        codAvailable = zoneRecord.codAvailable;
      }
    }

    const basePrice = Number(method.price);
    const total = basePrice + surcharge;

    return {
      method: {
        id: method.id,
        name: method.name,
        description: method.description,
        price: basePrice,
        currency: method.currency,
        estimatedDays: method.estimatedDays,
        isActive: method.isActive,
      },
      zone,
      basePrice,
      surcharge,
      total,
      currency: method.currency,
      estimatedDays: method.estimatedDays,
      codAvailable,
    };
  } catch {
    return null;
  }
}