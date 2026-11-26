import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Type-safe, validated environment variables.
 *
 * Importing `env` anywhere guarantees the listed variables exist and are well-formed
 * at process boot — a missing/invalid value throws immediately instead of surfacing
 * as a confusing runtime error deep in a request.
 *
 * Conventions:
 * - `server`  : secrets, never sent to the browser.
 * - `client`  : must be prefixed with NEXT_PUBLIC_ and is safe to expose.
 * - Optional providers (OAuth, email) are `.optional()` so the app boots before they
 *   are configured; the relevant feature degrades gracefully when absent.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // --- Database (Neon PostgreSQL) ---
    // Pooled connection (PgBouncer) for the app; direct connection for migrations.
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1).optional(),

    // --- Better Auth ---
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.url().optional(),
    APP_URL: z.url().optional(),

    // --- Social OAuth (optional until configured) ---
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
    FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),

    // --- Transactional email (optional until configured) ---
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    // --- Cloudinary media (optional until configured) ---
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),

    // --- PayFast direct API (JazzCash + Easypaisa + cards) ---
    // Optional: when unset the app uses the built-in SANDBOX provider (no real
    // charges) so the whole payment flow is clickable in development.
    PAYFAST_MERCHANT_ID: z.string().min(1).optional(),
    PAYFAST_SECURED_KEY: z.string().min(1).optional(),
    PAYFAST_API_BASE: z.url().optional(),
    PAYFAST_MERCHANT_CATEGORY_CODE: z.string().min(1).optional(),
    PAYFAST_CARD_ACCOUNT_TYPE: z.string().min(1).optional(),
    PAYFAST_JAZZCASH_BANK_CODE: z.string().min(1).optional(),
    PAYFAST_JAZZCASH_ACCOUNT_TYPE: z.string().min(1).optional(),
    PAYFAST_EASYPAISA_BANK_CODE: z.string().min(1).optional(),
    PAYFAST_EASYPAISA_ACCOUNT_TYPE: z.string().min(1).optional(),
    PAYFAST_MODE: z.enum(["disabled", "sandbox", "live"]).default("disabled"),
    PAYFAST_LIVE_ENABLED: z.enum(["true", "false"]).default("false"),
    // Test-only: allows the built-in simulated gateway in a production build
    // (preview/staging) when PayFast credentials are not configured. Never enable
    // this on a public production deployment — it marks inspections paid without
    // a real charge. Real PayFast credentials always take precedence.
    PAYMENTS_TEST_MODE: z.enum(["true", "false"]).default("false"),

    // --- PTA / CPID device verification ---
    // Test-only: allows simulated PTA/CPID results in a production build. Results
    // are stored and displayed as simulated; never enable on public production.
    // A real provider adapter must be registered before accurate checks exist.
    DEVICE_VERIFICATION_TEST_MODE: z.enum(["true", "false"]).default("false"),

    // --- Firebase Cloud Messaging (optional; server-side service account) ---
    // Never expose service-account credentials with a NEXT_PUBLIC_ prefix.
    FCM_PROJECT_ID: z.string().min(1).optional(),
    FCM_CLIENT_EMAIL: z.string().min(1).optional(),
    FCM_PRIVATE_KEY: z.string().min(1).optional(),

    // --- Vision LLM for "Sell Your Phone" AI grading ---
    // Optional: when unset, grading falls back to a deterministic DEV grader so the
    // whole quote flow is testable without an API key (mirrors the other providers).
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    /** Overridable so we can bump to a newer vision-capable model without code changes. */
    ANTHROPIC_VISION_MODEL: z.string().min(1).optional(),

    // --- Scheduled jobs ---
    // Shared secret guarding internal cron endpoints (e.g. expiring stale quotes).
    // A request must send `Authorization: Bearer <CRON_SECRET>`.
    CRON_SECRET: z.string().min(1).optional(),

    // --- Twilio (phone OTP over WhatsApp/SMS) ---
    // Optional: when unset, phone OTP falls back to a DEV provider that logs the
    // code to the server console instead of sending it, so the flow is testable
    // without a Twilio account. Set all three (+ optional channel) to send for real.
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    /** Sender: a Twilio number ("+1..."), or for WhatsApp a "whatsapp:+1..." sender. */
    TWILIO_FROM_NUMBER: z.string().min(1).optional(),
    /** Delivery channel for the OTP. Defaults to SMS. */
    TWILIO_OTP_CHANNEL: z.enum(["sms", "whatsapp"]).optional(),
  },

  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("GenTech"),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),

    // --- Region (optional; defaults to PAKISTAN per-user) ---
    // Set at runtime via user profile; not a global app config.
    // Only exposed to client if explicitly needed for UI locale/etc.
    NEXT_PUBLIC_REGION: z.string().min(1).optional(),

    // --- Analytics (optional; each provider loads only when its id is set) ---
    NEXT_PUBLIC_GTM_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_GA4_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_META_PIXEL_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().min(1).optional(),
  },

  /**
   * Next.js bundles client vars at build time, so they must be destructured
   * manually. Server vars are read from `process.env` automatically.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_REGION: process.env.NEXT_PUBLIC_REGION,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  emptyStringAsUndefined: true,

  /**
   * Allow `pnpm build` / lint to run in CI without a populated env by setting
   * SKIP_ENV_VALIDATION=1. Never set this at runtime.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
