import { describe, expect, it } from "vitest";

import { createListingSchema } from "@/features/listings/schemas/create-listing";
import {
  bookInspectionSchema,
  requestInspectionSchema,
} from "@/features/inspections/schemas/inspection";
import { getAreasForCity, getCitiesForCountry } from "@/features/locations/lib/location-selection";

const listingInput = {
  title: "Phone in good condition",
  description: "A carefully maintained phone with all accessories included.",
  price: 25000,
  condition: "USED",
  categorySlug: "smartphones",
  countryId: "country-pakistan",
  cityId: "city-karachi",
  areaId: "area-gulshan",
  images: [{ url: "https://example.com/phone.jpg" }],
};

const inspectionLocation = {
  countryId: "country-pakistan",
  cityId: "city-karachi",
  areaId: "area-gulshan",
};

describe("location selection validation", () => {
  it("limits available cities and areas to their selected parent", () => {
    const locations = [
      {
        id: "pk",
        cities: [
          { id: "karachi", name: "Karachi", areas: [{ id: "gulshan", name: "Gulshan" }] },
          { id: "lahore", name: "Lahore", areas: [{ id: "gulberg", name: "Gulberg" }] },
        ],
      },
      {
        id: "ae",
        cities: [{ id: "dubai", name: "Dubai", areas: [{ id: "marina", name: "Marina" }] }],
      },
    ];

    expect(getCitiesForCountry(locations, "pk").map((city) => city.id)).toEqual([
      "karachi",
      "lahore",
    ]);
    expect(getCitiesForCountry(locations, "unknown")).toEqual([]);
    expect(getAreasForCity(locations, "karachi")).toEqual([{ id: "gulshan", name: "Gulshan" }]);
    expect(getAreasForCity(locations, "unknown")).toEqual([]);
  });

  it("accepts listing location IDs and an optional area", () => {
    expect(createListingSchema.safeParse(listingInput).success).toBe(true);
    expect(createListingSchema.safeParse({ ...listingInput, areaId: "" }).success).toBe(true);
  });

  it("requires a country and city for new listings", () => {
    expect(createListingSchema.safeParse({ ...listingInput, countryId: "" }).success).toBe(false);
    expect(createListingSchema.safeParse({ ...listingInput, cityId: "" }).success).toBe(false);
  });

  it("requires a country and city for inspection requests and bookings", () => {
    const request = {
      listingId: "listing-1",
      planId: "plan-1",
      contactName: "Buyer Name",
      contactPhone: "03001234567",
      ...inspectionLocation,
    };
    const booking = {
      planId: "plan-1",
      deviceInfo: "Phone model",
      contactName: "Buyer Name",
      contactPhone: "03001234567",
      ...inspectionLocation,
    };

    expect(requestInspectionSchema.safeParse(request).success).toBe(true);
    expect(bookInspectionSchema.safeParse(booking).success).toBe(true);
    expect(requestInspectionSchema.safeParse({ ...request, cityId: "" }).success).toBe(false);
    expect(bookInspectionSchema.safeParse({ ...booking, countryId: "" }).success).toBe(false);
  });
});
