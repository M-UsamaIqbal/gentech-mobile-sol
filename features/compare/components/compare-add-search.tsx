"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import type { ListingCardData } from "@/types/marketplace";
import { useCompareSelection } from "./compare-selection-provider";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

function isListingCardData(value: unknown): value is ListingCardData {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ListingCardData>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.price === "number";
}

/** Live, region-scoped listing picker shown while compare mode is active. */
export function CompareAddSearch() {
  const t = useTranslations("compare");
  const { country, locale } = useLocalizedRouteInfo();
  const { selected, max, toggle } = useCompareSelection();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ListingCardData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const debouncedQuery = useDebouncedValue(query, 200);
  const term = debouncedQuery.trim();
  const listId = React.useId();

  React.useEffect(() => {
    if (term.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    let active = true;

    const params = new URLSearchParams({ q: term, limit: String(RESULT_LIMIT) });
    if (country) params.set("country", country);

    void fetch(`/api/v1/search/listings?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Listing search failed");
        const payload = (await response.json()) as { items?: unknown };
        return Array.isArray(payload.items) ? payload.items.filter(isListingCardData) : [];
      })
      .then((items) => {
        if (active) setResults(items);
      })
      .catch(() => {
        if (active) {
          setResults([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [country, term]);

  const trimmedQuery = query.trim();
  const hasEnoughCharacters = trimmedQuery.length >= MIN_QUERY_LENGTH;
  // Covers the debounce window before the effect has started the request.
  const searching = loading || (hasEnoughCharacters && trimmedQuery !== term);
  const showPanel = trimmedQuery.length > 0;
  const showNoResults = hasEnoughCharacters && !searching && !failed && term === trimmedQuery && results.length === 0;
  const atLimit = selected.length >= max;

  function updateQuery(value: string) {
    setQuery(value);
    setResults([]);
    setFailed(false);
    setLoading(value.trim().length >= MIN_QUERY_LENGTH);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") updateQuery("");
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          className="h-9 ps-9 pe-9"
        />
        {query ? (
          <button
            type="button"
            onClick={() => updateQuery("")}
            aria-label={t("searchClear")}
            className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="bg-popover absolute inset-x-0 bottom-full z-50 mb-2 max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-xl">
          {!hasEnoughCharacters ? (
            <p className="text-muted-foreground p-3 text-center text-xs">{t("searchHint")}</p>
          ) : null}

          {searching ? (
            <p className="text-muted-foreground p-3 text-center text-xs">{t("searching")}</p>
          ) : null}

          {hasEnoughCharacters && failed ? (
            <p className="text-destructive p-3 text-center text-xs" role="alert">
              {t("searchError")}
            </p>
          ) : null}

          {showNoResults ? (
            <p className="text-muted-foreground p-3 text-center text-xs">{t("searchNoResults")}</p>
          ) : null}

          {results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label={t("searchResults")} className="space-y-1">
              {results.map((listing) => {
                const isSelected = selected.includes(listing.id);
                const disabled = atLimit && !isSelected;

                return (
                  <li key={listing.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={disabled}
                      onClick={() => toggle(listing.id)}
                      aria-label={`${isSelected ? t("removeFromCompare") : t("addToCompare")}: ${listing.title}`}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg border p-2 text-start transition-colors",
                        isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border-2",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/50",
                        )}
                      >
                        {isSelected ? <Check className="size-3.5" /> : null}
                      </span>
                      {listing.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.imageUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded text-[10px]">
                          {listing.brand?.slice(0, 2) ?? "??"}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{listing.title}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {[listing.brand, listing.city].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="text-primary shrink-0 text-xs font-semibold">
                        {formatPrice(listing.price, { currency: listing.currency, locale: locale ?? "en" })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {atLimit ? (
            <p className="text-muted-foreground border-t p-2 pt-3 text-center text-xs">
              {t("limitReached")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
