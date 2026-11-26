import type { CountryConfig } from "./types"

/**
 * Pakistan country configuration.
 *
 * - Default language: Urdu (RTL)
 * - Available languages: Urdu, English
 * - Currency: PKR (0 decimal places)
 * - Payment: JazzCash, Easypaisa, bank transfer, COD, Visa, Mastercard
 * - Tax: configurable federal/provincial
 */
export const pkConfig: CountryConfig = {
  code: "PK",
  name: "Pakistan",
  nativeName: "پاکستان",
  flag: "🇵🇰",
  /** Country-based default when no explicit/browser preference exists. */
  defaultLocale: "ur",
  /** All supported UI languages are available in Pakistan. */
  availableLocales: ["en", "ar", "ur"],
  defaultCurrency: "PKR",
  /** UI direction follows the selected language (ar/ur RTL, en LTR). */
  rtl: true,
  paymentMethods: ["jazzcash", "easypaisa", "bank_transfer", "cod", "visa", "mastercard"],
  shippingMethods: ["local_courier", "express_courier", "pickup"],
  taxConfig: {
    vatRate: 0, // Pakistan has no standard VAT; configurable per province
    vatName: "Tax",
  },
  contactInfo: {
    email: "support@gentech.pk",
    phone: "+92 300 1234567",
    address: "Karachi, Pakistan",
    whatsapp: "+92 300 1234567",
  },
  businessPolicies: {
    returnPolicy: "7-day return policy for unused items in original packaging.",
    shippingPolicy: "2-3 business days within major cities, 5-7 days for remote areas.",
    privacyPolicy: "Your data is protected under Pakistan's data protection guidelines.",
  },
}