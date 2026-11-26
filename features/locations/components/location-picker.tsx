"use client";

import type { LocationTree } from "@/features/locations/services/location.service";
import { getAreasForCity, getCitiesForCountry } from "@/features/locations/lib/location-selection";

export interface LocationSelection {
  countryId: string;
  cityId: string;
  areaId: string;
}

export function LocationPicker({
  locations,
  value,
  onChange,
  prefix,
  showArea = true,
  required = true,
}: {
  locations: LocationTree;
  value: LocationSelection;
  onChange: (selection: LocationSelection) => void;
  prefix: string;
  showArea?: boolean;
  required?: boolean;
}) {
  const selectedCountry = locations.find((country) => country.id === value.countryId);
  const cities = getCitiesForCountry(locations, value.countryId);
  const areas = getAreasForCity(locations, value.cityId);
  const selectedCity = cities.some((city) => city.id === value.cityId);

  return (
    <>
      <div className="grid gap-2">
        <label htmlFor={`${prefix}-country`} className="text-sm font-medium">
          Country
        </label>
        <select
          id={`${prefix}-country`}
          value={value.countryId}
          required={required}
          onChange={(event) => onChange({ countryId: event.target.value, cityId: "", areaId: "" })}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
        >
          <option value="" disabled>
            Select a country
          </option>
          {locations.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor={`${prefix}-city`} className="text-sm font-medium">
          City
        </label>
        <select
          id={`${prefix}-city`}
          value={value.cityId}
          required={required}
          disabled={!selectedCountry}
          onChange={(event) => onChange({ ...value, cityId: event.target.value, areaId: "" })}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm disabled:opacity-60"
        >
          <option value="" disabled>
            {selectedCountry ? "Select a city" : "Choose a country first"}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
      {showArea ? (
        <div className="grid gap-2">
          <label htmlFor={`${prefix}-area`} className="text-sm font-medium">
            Area / neighbourhood <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id={`${prefix}-area`}
            value={value.areaId}
            disabled={!selectedCity || areas.length === 0}
            onChange={(event) => onChange({ ...value, areaId: event.target.value })}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm disabled:opacity-60"
          >
            <option value="">
              {!selectedCity
                ? "Choose a city first"
                : areas.length > 0
                  ? "Select an area"
                  : "No areas configured"}
            </option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}
