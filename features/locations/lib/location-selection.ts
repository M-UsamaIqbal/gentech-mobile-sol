export interface LocationOptionTree {
  id: string;
  cities: Array<{
    id: string;
    name: string;
    areas: Array<{ id: string; name: string }>;
  }>;
}

export function getCitiesForCountry<T extends LocationOptionTree>(
  locations: T[],
  countryId: string,
) {
  return locations.find((country) => country.id === countryId)?.cities ?? [];
}

export function getAreasForCity<T extends LocationOptionTree>(locations: T[], cityId: string) {
  for (const country of locations) {
    const city = country.cities.find((entry) => entry.id === cityId);
    if (city) return city.areas;
  }
  return [];
}
