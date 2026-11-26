"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CountryWithCities } from "@/features/admin/repositories/location.repository";
import {
  createCountryAction,
  updateCountryAction,
  createCityAction,
  updateCityAction,
  deleteCityAction,
  createAreaAction,
  updateAreaAction,
  deleteAreaAction,
} from "../actions/location-admin.actions";

export function LocationManager({ countries }: { countries: CountryWithCities[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [expandedCityId, setExpandedCityId] = React.useState<string | null>(null);
  const [showCountryForm, setShowCountryForm] = React.useState(false);
  const [showCityForm, setShowCityForm] = React.useState(false);
  const [countryName, setCountryName] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");
  const [editingCountry, setEditingCountry] = React.useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [cityName, setCityName] = React.useState("");
  const [cityCountryId, setCityCountryId] = React.useState("");
  const [province, setProvince] = React.useState("");
  const [popular, setPopular] = React.useState(false);
  const [editingCity, setEditingCity] = React.useState<{
    id: string;
    name: string;
    province: string;
  } | null>(null);
  const [areaCityId, setAreaCityId] = React.useState<string | null>(null);
  const [areaName, setAreaName] = React.useState("");
  const [editingArea, setEditingArea] = React.useState<{ id: string; name: string } | null>(null);
  const [pending, setPending] = React.useState(false);

  const query = search.trim().toLowerCase();
  const visibleCountries = countries
    .map((country) => {
      const countryMatches = country.name.toLowerCase().includes(query);
      return {
        ...country,
        cities:
          countryMatches || !query
            ? country.cities
            : country.cities.filter(
                (city) =>
                  city.name.toLowerCase().includes(query) ||
                  city.areas.some((area) => area.name.toLowerCase().includes(query)),
              ),
      };
    })
    .filter(
      (country) =>
        !query || country.name.toLowerCase().includes(query) || country.cities.length > 0,
    );
  const cityCount = countries.reduce((total, country) => total + country.cities.length, 0);
  const areaCount = countries.reduce(
    (total, country) =>
      total + country.cities.reduce((cityTotal, city) => cityTotal + city.areas.length, 0),
    0,
  );

  async function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update locations.");
      return false;
    }
    toast.success(success);
    router.refresh();
    return true;
  }

  async function handleCreateCountry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await runAction(
        () => createCountryAction({ name: countryName, code: countryCode }),
        "Country created.",
      )
    ) {
      setCountryName("");
      setCountryCode("");
      setShowCountryForm(false);
    }
  }

  async function handleCreateCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await runAction(
        () =>
          createCityAction({
            name: cityName,
            countryId: cityCountryId,
            province: province || undefined,
            popular,
          }),
        "City created.",
      )
    ) {
      setCityName("");
      setProvince("");
      setPopular(false);
      setShowCityForm(false);
    }
  }

  async function handleCreateArea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!areaCityId) return;
    if (
      await runAction(
        () => createAreaAction({ name: areaName, cityId: areaCityId }),
        "Area created.",
      )
    ) {
      setAreaName("");
      setAreaCityId(null);
    }
  }

  async function handleToggleCountry(country: CountryWithCities) {
    await runAction(
      () => updateCountryAction({ id: country.id, isActive: !country.isActive }),
      `Country ${country.isActive ? "deactivated" : "activated"}.`,
    );
  }

  async function handleSaveCountry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCountry) return;
    if (
      await runAction(
        () =>
          updateCountryAction({
            id: editingCountry.id,
            name: editingCountry.name,
            code: editingCountry.code,
          }),
        "Country updated.",
      )
    ) {
      setEditingCountry(null);
    }
  }

  async function handleToggleCity(city: CountryWithCities["cities"][number]) {
    await runAction(
      () => updateCityAction({ id: city.id, isActive: !city.isActive }),
      `City ${city.isActive ? "deactivated" : "activated"}.`,
    );
  }

  async function handleSaveCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCity) return;
    if (
      await runAction(
        () =>
          updateCityAction({
            id: editingCity.id,
            name: editingCity.name,
            province: editingCity.province || null,
          }),
        "City updated.",
      )
    ) {
      setEditingCity(null);
    }
  }

  async function handleToggleArea(area: CountryWithCities["cities"][number]["areas"][number]) {
    await runAction(
      () => updateAreaAction({ id: area.id, isActive: !area.isActive }),
      `Area ${area.isActive ? "deactivated" : "activated"}.`,
    );
  }

  async function handleSaveArea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingArea) return;
    if (
      await runAction(
        () => updateAreaAction({ id: editingArea.id, name: editingArea.name }),
        "Area updated.",
      )
    ) {
      setEditingArea(null);
    }
  }

  async function handleDeleteCity(id: string, name: string) {
    if (
      !window.confirm(
        `Delete ${name} and its areas? Existing listing location text will be preserved.`,
      )
    )
      return;
    await runAction(() => deleteCityAction(id), "City deleted.");
  }

  async function handleDeleteArea(id: string, name: string) {
    if (!window.confirm(`Delete area ${name}? Existing listing location text will be preserved.`))
      return;
    await runAction(() => deleteAreaAction(id), "Area deleted.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace catalog
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Location taxonomy
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure active countries, cities, and neighbourhoods used across the marketplace.
          </p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(12rem,16rem)_auto_auto]">
          <div className="relative min-w-0">
            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search locations"
              aria-label="Search locations"
              className="border-white/10 bg-[#1F1F1F] pl-9 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={() => {
              setShowCityForm((value) => !value);
              setShowCountryForm(false);
            }}
            disabled={countries.filter((country) => country.isActive).length === 0}
            className="min-h-10 bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <Plus className="size-4" /> Add city
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowCountryForm((value) => !value);
              setShowCityForm(false);
            }}
            className="min-h-10 border-white/10 bg-[#1F1F1F] text-white hover:bg-white/10"
          >
            <Plus className="size-4" /> Add country
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/[0.07] bg-[#1F1F1F] px-4 py-3 text-xs">
        <span className="font-semibold text-slate-100">{countries.length.toLocaleString()}</span>
        <span className="text-slate-500">countries</span>
        <span className="font-semibold text-slate-100">{cityCount.toLocaleString()}</span>
        <span className="text-slate-500">cities</span>
        <span className="font-semibold text-slate-100">{areaCount.toLocaleString()}</span>
        <span className="text-slate-500">areas</span>
      </div>

      {showCountryForm ? (
        <form
          onSubmit={handleCreateCountry}
          className="grid gap-3 rounded-xl border border-white/10 bg-[#1F1F1F] p-4 sm:grid-cols-[1fr_10rem_auto]"
        >
          <Input
            value={countryName}
            onChange={(event) => setCountryName(event.target.value)}
            placeholder="Country name"
            required
            minLength={2}
            maxLength={80}
            aria-label="Country name"
            className="border-white/10 bg-[#0e0f12] text-white"
          />
          <Input
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
            placeholder="ISO code (PK)"
            required
            minLength={2}
            maxLength={3}
            aria-label="Country code"
            className="border-white/10 bg-[#0e0f12] text-white"
          />
          <Button
            type="submit"
            disabled={pending || countryName.trim().length < 2 || countryCode.trim().length < 2}
            className="bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null} Save country
          </Button>
        </form>
      ) : null}

      {showCityForm ? (
        <form
          onSubmit={handleCreateCity}
          className="grid gap-3 rounded-xl border border-white/10 bg-[#1F1F1F] p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <select
            value={cityCountryId}
            onChange={(event) => setCityCountryId(event.target.value)}
            required
            aria-label="Country for city"
            className="h-10 rounded-md border border-white/10 bg-[#0e0f12] px-3 text-sm text-white"
          >
            <option value="">Select country</option>
            {countries
              .filter((country) => country.isActive)
              .map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
          </select>
          <Input
            value={cityName}
            onChange={(event) => setCityName(event.target.value)}
            placeholder="City name"
            required
            minLength={2}
            maxLength={60}
            aria-label="City name"
            className="border-white/10 bg-[#0e0f12] text-white"
          />
          <Input
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            placeholder="Province / region (optional)"
            maxLength={60}
            aria-label="Province or region"
            className="border-white/10 bg-[#0e0f12] text-white"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={popular}
                onChange={(event) => setPopular(event.target.checked)}
              />
              Popular city
            </label>
            <Button
              type="submit"
              disabled={pending || cityName.trim().length < 2 || !cityCountryId}
              className="bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null} Save city
            </Button>
          </div>
        </form>
      ) : null}

      {visibleCountries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-slate-400">
          {countries.length === 0
            ? "No countries configured yet. Add a country to begin."
            : "No matching locations."}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCountries.map((country) => (
            <section
              key={country.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                {editingCountry?.id === country.id ? (
                  <form
                    onSubmit={handleSaveCountry}
                    className="flex min-w-0 flex-1 flex-wrap gap-2"
                  >
                    <Input
                      value={editingCountry.name}
                      onChange={(event) =>
                        setEditingCountry({ ...editingCountry, name: event.target.value })
                      }
                      required
                      minLength={2}
                      maxLength={80}
                      aria-label="Edit country name"
                      className="h-9 max-w-64 border-white/10 bg-[#0e0f12] text-white"
                    />
                    <Input
                      value={editingCountry.code}
                      onChange={(event) =>
                        setEditingCountry({
                          ...editingCountry,
                          code: event.target.value.toUpperCase(),
                        })
                      }
                      required
                      minLength={2}
                      maxLength={3}
                      aria-label="Edit country code"
                      className="h-9 max-w-32 border-white/10 bg-[#0e0f12] text-white"
                    />
                    <Button type="submit" size="sm" disabled={pending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingCountry(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold text-white">
                        {country.name}{" "}
                        <span className="text-xs font-normal text-slate-500">{country.code}</span>
                      </h2>
                      <p className="text-xs text-slate-500">{country.cities.length} cities</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {editingCountry?.id !== country.id ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${country.name}`}
                      disabled={pending}
                      onClick={() =>
                        setEditingCountry({
                          id: country.id,
                          name: country.name,
                          code: country.code,
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleToggleCountry(country)}
                    disabled={pending || editingCountry?.id === country.id}
                    aria-pressed={country.isActive}
                    className="rounded-full focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                  >
                    <Badge
                      className={
                        country.isActive
                          ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                          : "border-white/10 bg-slate-800 text-slate-400"
                      }
                    >
                      {country.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </div>
              </header>

              {country.cities.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No matching cities.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {country.cities.map((city) => {
                    const expanded = expandedCityId === city.id;
                    return (
                      <div key={city.id}>
                        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedCityId(expanded ? null : city.id)}
                              aria-label={`${expanded ? "Collapse" : "Expand"} ${city.name} areas`}
                              aria-expanded={expanded}
                              className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-white/[0.06] hover:text-white"
                            >
                              {expanded ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                            {editingCity?.id === city.id ? (
                              <form
                                onSubmit={handleSaveCity}
                                className="flex min-w-0 flex-1 flex-wrap gap-2"
                              >
                                <Input
                                  value={editingCity.name}
                                  onChange={(event) =>
                                    setEditingCity({ ...editingCity, name: event.target.value })
                                  }
                                  required
                                  minLength={2}
                                  maxLength={60}
                                  aria-label="Edit city name"
                                  className="h-9 max-w-64 border-white/10 bg-[#0e0f12] text-white"
                                />
                                <Input
                                  value={editingCity.province}
                                  onChange={(event) =>
                                    setEditingCity({ ...editingCity, province: event.target.value })
                                  }
                                  maxLength={60}
                                  aria-label="Edit province or region"
                                  placeholder="Province / region"
                                  className="h-9 max-w-48 border-white/10 bg-[#0e0f12] text-white"
                                />
                                <Button type="submit" size="sm" disabled={pending}>
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCity(null)}
                                >
                                  Cancel
                                </Button>
                              </form>
                            ) : (
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {city.name}
                                  {city.province ? (
                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                      ({city.province})
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {city.areas.length} areas{city.popular ? " ┬╖ Popular" : ""}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => handleToggleCity(city)}
                              disabled={pending}
                              aria-pressed={city.isActive}
                              className="rounded-full"
                            >
                              <Badge
                                className={
                                  city.isActive
                                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                                    : "border-white/10 bg-slate-800 text-slate-400"
                                }
                              >
                                {city.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Edit ${city.name}`}
                              disabled={pending || editingCity?.id === city.id}
                              onClick={() =>
                                setEditingCity({
                                  id: city.id,
                                  name: city.name,
                                  province: city.province ?? "",
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAreaCityId(city.id);
                                setExpandedCityId(city.id);
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              <Plus className="size-3.5" /> Add area
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDeleteCity(city.id, city.name)}
                              disabled={pending}
                              aria-label={`Delete ${city.name}`}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {areaCityId === city.id ? (
                          <form
                            onSubmit={handleCreateArea}
                            className="mx-3 mb-3 flex flex-col gap-2 rounded-lg border border-white/10 bg-[#0e0f12] p-3 sm:flex-row"
                          >
                            <Input
                              value={areaName}
                              onChange={(event) => setAreaName(event.target.value)}
                              placeholder={`New area in ${city.name}`}
                              required
                              minLength={2}
                              maxLength={80}
                              aria-label={`New area name for ${city.name}`}
                              className="border-white/10 bg-[#1F1F1F] text-white"
                            />
                            <Button
                              type="submit"
                              disabled={pending || areaName.trim().length < 2}
                              className="bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
                            >
                              {pending ? <Loader2 className="size-4 animate-spin" /> : null} Save
                              area
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setAreaCityId(null)}
                            >
                              Cancel
                            </Button>
                          </form>
                        ) : null}

                        {expanded ? (
                          <div className="space-y-2 border-t border-white/5 bg-[#0e0f12] p-3 sm:px-12">
                            {city.areas.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                No areas configured for {city.name}.
                              </p>
                            ) : null}
                            {city.areas.map((area) => (
                              <div
                                key={area.id}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
                              >
                                {editingArea?.id === area.id ? (
                                  <form
                                    onSubmit={handleSaveArea}
                                    className="flex min-w-0 flex-1 gap-2"
                                  >
                                    <Input
                                      value={editingArea.name}
                                      onChange={(event) =>
                                        setEditingArea({ ...editingArea, name: event.target.value })
                                      }
                                      required
                                      minLength={2}
                                      maxLength={80}
                                      aria-label={`Edit ${area.name}`}
                                      className="h-9 border-white/10 bg-[#1F1F1F] text-white"
                                    />
                                    <Button type="submit" size="sm" disabled={pending}>
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingArea(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </form>
                                ) : (
                                  <>
                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                                      {area.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleArea(area)}
                                      disabled={pending}
                                      aria-pressed={area.isActive}
                                      className="rounded-full"
                                    >
                                      <Badge
                                        className={
                                          area.isActive
                                            ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                                            : "border-white/10 bg-slate-800 text-slate-400"
                                        }
                                      >
                                        {area.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </button>
                                    <Button
                                      type="button"
                                      size="icon-sm"
                                      variant="ghost"
                                      aria-label={`Edit ${area.name}`}
                                      onClick={() =>
                                        setEditingArea({ id: area.id, name: area.name })
                                      }
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon-sm"
                                      variant="ghost"
                                      aria-label={`Delete ${area.name}`}
                                      onClick={() => handleDeleteArea(area.id, area.name)}
                                      disabled={pending}
                                      className="text-rose-400 hover:text-rose-300"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
