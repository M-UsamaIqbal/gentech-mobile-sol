import type { CountryCode } from "@/lib/countries/types";

/**
 * Country-specific phone validation. Formatting characters are ignored so a
 * user can paste `+973 1234 5678` or `0300 1234567` without errors.
 */
const FORMATTING_CHARACTERS = /[\s\-().]/g;

export function normalizePhoneInput(value: string): string {
  return value.trim().replace(FORMATTING_CHARACTERS, "");
}

const BH_PATTERN = /^(?:\+?973|00973)?[135679]\d{7}$/;
const PK_PATTERN = /^(?:\+92|0092|0)?3\d{9}$/;

export function isValidPhoneForCountry(value: string, country: CountryCode): boolean {
  const phone = normalizePhoneInput(value);
  if (!phone) return false;
  return country === "BH" ? BH_PATTERN.test(phone) : PK_PATTERN.test(phone);
}

/** Returns a localized validation message, or null when the number is valid. */
export function validatePhoneForCountry(
  value: string | null | undefined,
  country: CountryCode,
): string | null {
  if (!value?.trim()) return null;
  return isValidPhoneForCountry(value, country)
    ? null
    : country === "BH"
      ? "Enter a valid Bahrain phone number (for example +973 1234 5678)."
      : "Enter a valid Pakistan phone number (for example 0300 1234567).";
}
