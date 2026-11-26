import { APP } from "@/lib/constants";

/**
 * Currency configuration by currency code.
 * BHD uses 3 decimal places (fils), PKR uses 0 decimal places.
 */
const CURRENCY_CONFIG: Record<string, { locale: string; decimals: number }> = {
  BHD: { locale: "en-BH", decimals: 3 },
  PKR: { locale: "en-PK", decimals: 0 },
}

/**
 * Formats a price for display. Accepts a number, string, or Decimal-like value.
 * Uses the app locale/currency by default (en-PK / PKR → "Rs 84,999").
 * Supports BHD (3 decimals) and PKR (0 decimals) based on currency code.
 */
export function formatPrice(
  value: number | string,
  options?: { currency?: string; compact?: boolean; locale?: string },
): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "—";

  const currency = options?.currency ?? APP.defaultCurrency;
  const config = CURRENCY_CONFIG[currency] ?? { locale: APP.locale, decimals: 0 }
  const region = currency === "BHD" ? "BH" : "PK";
  const locale = options?.locale
    ? options.locale.includes("-")
      ? options.locale
      : `${options.locale}-${region}`
    : config.locale;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: config.decimals,
    minimumFractionDigits: config.decimals,
    notation: options?.compact ? "compact" : "standard",
  }).format(amount);
}

const JUST_NOW: Record<string, string> = {
  ar: "الآن",
  ur: "ابھی",
  en: "just now",
};

/** Relative time like "2h ago", "3d ago". Falls back to a short date for older items. */
export function formatRelativeTime(date: Date | string, locale: string = APP.locale): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(-Math.round(seconds / secondsInUnit), unit);
    }
  }
  return JUST_NOW[locale.split("-")[0] ?? "en"] ?? "just now";
}
