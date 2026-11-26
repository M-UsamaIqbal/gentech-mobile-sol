/**
 * Centralized payment configuration.
 *
 * Country-specific payment methods and provider settings.
 * Designed to support additional countries (SA, UAE, QA, KW) via configuration.
 */

import type { CountryCode } from "@/lib/countries/types";

export interface PaymentMethodConfig {
  id: string;
  name: string;
  displayName: string;
  type: "online" | "offline";
  provider: string;
  enabled: boolean;
  icon?: string;
  description?: string;
  supportedCurrencies: string[];
  refundSupported: boolean;
  sandboxOnly?: boolean;
}

export interface CountryPaymentConfig {
  country: CountryCode;
  currency: string;
  methods: PaymentMethodConfig[];
  defaultMethod: string;
  taxRate: number;
  taxName: string;
}

export const PAYMENT_CONFIGS: Record<CountryCode, CountryPaymentConfig> = {
  BH: {
    country: "BH",
    currency: "BHD",
    defaultMethod: "benefitpay",
    taxRate: 0.05,
    taxName: "VAT",
    methods: [
      {
        id: "benefitpay",
        name: "BenefitPay",
        displayName: "BenefitPay",
        type: "online",
        provider: "benefitpay",
        enabled: false, // Requires merchant credentials
        description: "Pay with BenefitPay mobile wallet",
        supportedCurrencies: ["BHD"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "visa",
        name: "Visa",
        displayName: "Visa Card",
        type: "online",
        provider: "card",
        enabled: false,
        description: "Pay with Visa card",
        supportedCurrencies: ["BHD"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "mastercard",
        name: "Mastercard",
        displayName: "Mastercard",
        type: "online",
        provider: "card",
        enabled: false,
        description: "Pay with Mastercard",
        supportedCurrencies: ["BHD"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "sandbox",
        name: "Sandbox",
        displayName: "Sandbox (Test)",
        type: "online",
        provider: "sandbox",
        enabled: true, // Always available for testing
        description: "Simulated payment for testing",
        supportedCurrencies: ["BHD", "PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
    ],
  },
  PK: {
    country: "PK",
    currency: "PKR",
    defaultMethod: "jazzcash",
    taxRate: 0,
    taxName: "Tax",
    methods: [
      {
        id: "jazzcash",
        name: "JazzCash",
        displayName: "JazzCash",
        type: "online",
        provider: "jazzcash",
        enabled: false, // Requires merchant credentials
        description: "Pay with JazzCash mobile wallet",
        supportedCurrencies: ["PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "easypaisa",
        name: "Easypaisa",
        displayName: "Easypaisa",
        type: "online",
        provider: "easypaisa",
        enabled: false,
        description: "Pay with Easypaisa mobile wallet",
        supportedCurrencies: ["PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "bank_transfer",
        name: "Bank Transfer",
        displayName: "Bank Transfer",
        type: "offline",
        provider: "bank_transfer",
        enabled: true, // Always available
        description: "Direct bank transfer",
        supportedCurrencies: ["PKR"],
        refundSupported: false,
      },
      {
        id: "cod",
        name: "Cash on Delivery",
        displayName: "Cash on Delivery",
        type: "offline",
        provider: "cod",
        enabled: true, // Always available
        description: "Pay when you receive",
        supportedCurrencies: ["PKR"],
        refundSupported: false,
      },
      {
        id: "visa",
        name: "Visa",
        displayName: "Visa Card",
        type: "online",
        provider: "card",
        enabled: false,
        description: "Pay with Visa card",
        supportedCurrencies: ["PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "mastercard",
        name: "Mastercard",
        displayName: "Mastercard",
        type: "online",
        provider: "card",
        enabled: false,
        description: "Pay with Mastercard",
        supportedCurrencies: ["PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
      {
        id: "sandbox",
        name: "Sandbox",
        displayName: "Sandbox (Test)",
        type: "online",
        provider: "sandbox",
        enabled: true, // Always available for testing
        description: "Simulated payment for testing",
        supportedCurrencies: ["BHD", "PKR"],
        refundSupported: true,
        sandboxOnly: true,
      },
    ],
  },
};

/**
 * Get payment config for a country.
 */
export function getPaymentConfig(country: CountryCode): CountryPaymentConfig {
  return PAYMENT_CONFIGS[country];
}

/**
 * Get enabled payment methods for a country.
 */
export function getEnabledPaymentMethods(country: CountryCode): PaymentMethodConfig[] {
  const config = getPaymentConfig(country);
  return config.methods.filter((m) => m.enabled);
}

/**
 * Get a specific payment method config.
 */
export function getPaymentMethod(country: CountryCode, methodId: string): PaymentMethodConfig | null {
  const config = getPaymentConfig(country);
  return config.methods.find((m) => m.id === methodId) || null;
}

/**
 * Check if a payment method is available for a country.
 */
export function isPaymentMethodAvailable(country: CountryCode, methodId: string): boolean {
  const method = getPaymentMethod(country, methodId);
  return method?.enabled ?? false;
}