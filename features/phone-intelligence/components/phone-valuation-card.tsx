"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatPrice } from "@/utils/format";
import type { PhoneValuationResult } from "../schemas/valuation.schema";

interface PhoneValuationCardProps {
  valuation: PhoneValuationResult;
  currency?: "PKR" | "BHD";
}

export function PhoneValuationCard({ valuation, currency = "PKR" }: PhoneValuationCardProps) {
  const locale = useLocale();
  const t = useTranslations("uiActions");
  const tCondition = useTranslations("condition");
  const priceRange = valuation.estimatedPriceMax - valuation.estimatedPriceMin;
  const avgPosition = priceRange > 0
    ? Math.min(100, Math.max(0, ((valuation.estimatedPriceAvg - valuation.estimatedPriceMin) / priceRange) * 100))
    : 100;

  return (
    <div className="bg-card rounded-lg border p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{valuation.modelName}</h3>
          <p className="text-muted-foreground text-sm">{valuation.brandName}</p>
        </div>
        {valuation.isPreview ? (
          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            {t("preview")}
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>{t("estimatedValue")}</span>
            <span className="font-semibold">
              {formatPrice(valuation.estimatedPriceAvg, { currency, locale })}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="absolute h-full bg-blue-600"
              style={{ left: "0%", width: `${avgPosition}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span>{formatPrice(valuation.estimatedPriceMin, { currency, locale })}</span>
            <span>{formatPrice(valuation.estimatedPriceMax, { currency, locale })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {valuation.storage ? (
            <div>
              <span className="text-muted-foreground">{t("storageLabel")}:</span>
              <span className="ms-2 font-medium">{valuation.storage}</span>
            </div>
          ) : null}
          {valuation.ram ? (
            <div>
              <span className="text-muted-foreground">{t("ramLabel")}:</span>
              <span className="ms-2 font-medium">{valuation.ram}</span>
            </div>
          ) : null}
          {valuation.condition ? (
            <div>
              <span className="text-muted-foreground">{t("conditionLabel")}:</span>
              <span className="ms-2 font-medium">{tCondition(valuation.condition)}</span>
            </div>
          ) : null}
          {valuation.batteryHealth !== null ? (
            <div>
              <span className="text-muted-foreground">{t("batteryLabel")}:</span>
              <span className="ms-2 font-medium">{valuation.batteryHealth}%</span>
            </div>
          ) : null}
        </div>

        {valuation.sampleCount !== null ? (
          <div className="border-t pt-3 text-xs">
            {t("basedOnListings", { count: valuation.sampleCount })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
