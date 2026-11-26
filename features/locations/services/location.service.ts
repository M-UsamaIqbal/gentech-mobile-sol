import "server-only";

import { unstable_cache } from "next/cache";

import type { CountryCode } from "@/lib/countries/types";
import { CATALOG_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache";
import { getActiveLocationTree as getActiveLocationTreeRecord } from "../repositories/location.repository";

const DEMO_LOCATIONS: Record<CountryCode, { name: string; cities: string[] }> = {
  BH: {
    name: "Bahrain",
    cities: ["Manama", "Riffa", "Muharraq", "Isa Town", "Sitra", "Jid Hafs", "Sanabis", "Budaiya"],
  },
  PK: {
    name: "Pakistan",
    cities: [
      "Karachi",
      "Lahore",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Multan",
      "Sialkot",
      "Gujranwala",
    ],
  },
};

function demoLocationTree(country: CountryCode) {
  const config = DEMO_LOCATIONS[country];
  return [
    {
      id: `demo-country-${country.toLowerCase()}`,
      name: config.name,
      code: country,
      cities: config.cities.map((city) => ({
        id: `demo-city-${country.toLowerCase()}-${city.toLowerCase().replace(/\s+/g, "-")}`,
        name: city,
        areas: [] as Array<{ id: string; name: string }>,
      })),
    },
  ];
}

/** Active location directory for one country; never mixes Bahrain and Pakistan. */
export async function getActiveLocationTree(country?: CountryCode) {
  return unstable_cache(
    async () => {
      try {
        const rows = await getActiveLocationTreeRecord(country);
        if (country && rows.length === 0) return demoLocationTree(country);
        return rows;
      } catch (error) {
        console.warn(
          "[locations] Could not load the active location directory.",
          error instanceof Error ? error.message : error,
        );
        return country ? demoLocationTree(country) : [];
      }
    },
    ["active-location-tree", country ?? "all"],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog],
    },
  )();
}

export type LocationTree = Awaited<ReturnType<typeof getActiveLocationTree>>;
