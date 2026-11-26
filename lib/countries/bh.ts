import type { CountryConfig } from "./types"

/**
 * Bahrain country configuration.
 *
 * - Default language: Arabic (RTL)
 * - Available languages: Arabic, English
 * - Currency: BHD (3 decimal places)
 * - Payment: BenefitPay, local cards, Visa, Mastercard
 * - Tax: 5% VAT (NBR)
 */
export const bhConfig: CountryConfig = {
  code: "BH",
  name: "Bahrain",
  nativeName: "البحرين",
  flag: "🇧🇭",
  /** Country-based default when no explicit/browser preference exists. */
  defaultLocale: "ar",
  /** All supported UI languages are available in Bahrain. */
  availableLocales: ["en", "ar", "ur"],
  defaultCurrency: "BHD",
  /** UI direction follows the selected language (ar/ur RTL, en LTR). */
  rtl: true,
  paymentMethods: ["benefitpay", "local_card", "visa", "mastercard"],
  shippingMethods: ["local_delivery", "express_delivery", "pickup"],
  taxConfig: {
    vatRate: 0.05,
    vatName: "VAT",
    vatNumber: "", // Set via env or admin
  },
  contactInfo: {
    email: "support@gentech.bh",
    phone: "+973 1234 5678",
    address: "Manama, Bahrain",
    whatsapp: "+973 1234 5678",
  },
  businessPolicies: {
    returnPolicy: "7-day return policy for unused items in original packaging.",
    shippingPolicy: "Same-day delivery within Manama, next-day for other governorates.",
    privacyPolicy: "Your data is protected under Bahrain's PDPL regulations.",
  },
}