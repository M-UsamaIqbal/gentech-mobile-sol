"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, GitCompareArrows, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import { MAX_COMPARE_ITEMS, toggleCompareSelection } from "@/features/compare/lib/selection";
import type { CompareSuggestions } from "@/features/compare/services/compare-suggestions.service";
import type { ListingCardData } from "@/types/marketplace";

function CandidateRow({
  listing,
  checked,
  disabled,
  onToggle,
  locale,
  label,
}: {
  listing: ListingCardData;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  locale: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-2 text-start transition-colors",
        checked ? "bg-primary/5 border-primary" : "hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded border-2",
          checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50",
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
      {listing.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageUrl} alt="" className="size-12 rounded object-cover" />
      ) : (
        <span className="bg-muted flex size-12 items-center justify-center rounded text-xs">
          {listing.brand?.slice(0, 2) ?? "??"}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{listing.title}</span>
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          {listing.brand ? <span>{listing.brand}</span> : null}
          <span>{listing.city}</span>
          {label ? <Badge variant="secondary" className="text-xs">{label}</Badge> : null}
        </span>
      </span>
      <span className="text-primary shrink-0 text-sm font-semibold">
        {formatPrice(listing.price, { currency: listing.currency, locale })}
      </span>
    </button>
  );
}

export function CompareSuggestionsDialog({
  current,
  suggestions,
}: {
  current: ListingCardData;
  suggestions: CompareSuggestions;
}) {
  const t = useTranslations("compare");
  const router = useRouter();
  const { country, locale, prefix } = useLocalizedRouteInfo();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggle = React.useCallback((id: string) => {
    setSelected((value) => toggleCompareSelection(value, id));
  }, []);

  const totalSections = suggestions.favorites.length + suggestions.previous.length + suggestions.suggested.length;

  function compare() {
    const ids = [current.id, ...selected].slice(0, MAX_COMPARE_ITEMS).join(",");
    const base = prefix || (country && locale ? `/${country.toLowerCase()}/${locale}` : "");
    router.push(`${base}/compare?listings=${ids}`);
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <GitCompareArrows className="size-4" />
        {t("detailOpen")}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="bg-background max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border shadow-xl"
          >
            <div className="border-b p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="compare-dialog-title" className="text-lg font-semibold">
                    {t("detailTitle")}
                  </h2>
                  <p className="text-muted-foreground text-sm">{t("detailHint")}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t("close")}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                  {t("current")}
                </h3>
                <CandidateRow
                  listing={current}
                  checked
                  disabled
                  onToggle={() => undefined}
                  locale={locale ?? "en"}
                />
              </section>

              {suggestions.favorites.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {t("fromFavorites")}
                  </h3>
                  <div className="space-y-2">
                    {suggestions.favorites.map((listing) => (
                      <CandidateRow
                        key={listing.id}
                        listing={listing}
                        checked={selected.includes(listing.id)}
                        disabled={!selected.includes(listing.id) && selected.length >= MAX_COMPARE_ITEMS - 1}
                        onToggle={() => toggle(listing.id)}
                        locale={locale ?? "en"}
                        label={t("favoriteBadge")}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {suggestions.previous.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {t("fromHistory")}
                  </h3>
                  <div className="space-y-2">
                    {suggestions.previous.map((listing) => (
                      <CandidateRow
                        key={listing.id}
                        listing={listing}
                        checked={selected.includes(listing.id)}
                        disabled={!selected.includes(listing.id) && selected.length >= MAX_COMPARE_ITEMS - 1}
                        onToggle={() => toggle(listing.id)}
                        locale={locale ?? "en"}
                        label={t("historyBadge")}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {suggestions.suggested.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {t("suggested")}
                  </h3>
                  <div className="space-y-2">
                    {suggestions.suggested.map((listing) => (
                      <CandidateRow
                        key={listing.id}
                        listing={listing}
                        checked={selected.includes(listing.id)}
                        disabled={!selected.includes(listing.id) && selected.length >= MAX_COMPARE_ITEMS - 1}
                        onToggle={() => toggle(listing.id)}
                        locale={locale ?? "en"}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {totalSections === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  {t("noSuggestions")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <p className="text-sm font-medium">
                {t("detailSelected", { count: selected.length + 1, max: MAX_COMPARE_ITEMS })}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="button" onClick={compare} disabled={selected.length < 1}>
                  <GitCompareArrows className="size-4" />
                  {t("compareSelected")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
